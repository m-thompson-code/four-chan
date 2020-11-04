import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { environment } from '@environment';
import { Subscription } from 'rxjs';

import firebase from 'firebase/app';

import 'firebase/analytics';

import { DataService, Post, Thread } from './services/data.service';
import { LoaderService } from './services/loader.service';

import { ScrollService } from './services/scroll.service';
import { StorageService } from './services/storage.service';
import { ResponsiveService } from './services/responsive.service';
import { PromiseFuncPoolService } from './services/promise-func-pool.service';
import { FavButtonService } from './services/fav-button.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.template.html',
    styleUrls: ['./app.style.scss']
})
export class AppComponent implements OnInit, OnDestroy {
    private scrollObserver?: Subscription;

    public boards: string[] = [];
    public showBoards: boolean = false;
    public selectedBoards: string[] = [];
    public selectedBoardMap: {
        [board: string]: boolean;
    } = {};

    public threads: Thread[] = [];

    public blockPostMap: {
        [mainPostNo: number]: {
            [postNo: number]: true;
        };
    } = {};

    public blockThreadMap: {
        [mainPostNo: number]: true;
    } = {};

    public threadMap: {
        [mainPostNo: number]: Thread;
    } = {};

    private getThreadsLoopTimeout?: number;

    public initalized: boolean = false;

    private _detachListeners?: () => void;

    public threadInView?: Thread | null;

    public agreeToTerms: string = '';
    public showCloseBoardsFlash: boolean = false;
    public errorCount: number = 0;

    private _errorCountInterval?: number;

    public pagesToLoad: number = 1;

    constructor(private renderer: Renderer2, private dataService: DataService, private promiseFuncPoolService: PromiseFuncPoolService,
        private storageService: StorageService, private scrollService: ScrollService, public favButtonService: FavButtonService, 
        public loaderService: LoaderService, private responsiveService: ResponsiveService) {
    }

    public ngOnInit(): void {
        const showFavButtons = this.storageService.getItem('__cached_show_fav_buttons') || 'on';

        if (showFavButtons === 'on') {
            this.favButtonService.showFavButtons = true;
        } else {
            this.favButtonService.showFavButtons = false;
        }
        
        this.pagesToLoad = +(this.storageService.getItem('__cached_pages_to_load') || 1);

        this.agreeToTerms = this.storageService.getItem('__cached_agree_to_terms') || '';

        if (!this.agreeToTerms) {
            this.showCloseBoardsFlash = true;
        }

        this._initalizeFirebase();

        this.responsiveService.init(this.renderer);
        this.scrollService.init(this.renderer);
        this.scrollObserver = this.scrollService.observable.subscribe(value => {
            this.threadInView = this._getThreadInView();
            console.log(this.threadInView);
        });

        // Handle getting screen height css variables
        const appHeight = () => {
            try {
                const doc = document.documentElement;

                const windowHeight = window.innerHeight;

                doc.style.setProperty('--app-height-100', `${windowHeight}px`);
                doc.style.setProperty('--app-height-50', `${windowHeight * .5}px`);
            } catch(error) {
                console.error(error);

                if (!environment.production) {
                    debugger;
                }
            }
        }

        const _onresize = () => {
            appHeight();
        };

        const _off__resize = this.renderer.listen('window', 'resize', _onresize);
        const _off__orientationchange = this.renderer.listen('window', 'orientationchange', _onresize);
        
        this._detachListeners = () => {
            _off__resize();
            _off__orientationchange();
        };

        appHeight();

        void this.init();
    }

    public init(): void {
        this.loaderService.inc();

        void this.getBoards().then(() => {
            const cachedBoards = this.storageService.getItem("__cached_boards");
            const selectedBoards = cachedBoards && JSON.parse(cachedBoards) || [];

            if (selectedBoards.length) {
                for (const selectedBoard of selectedBoards) {
                    this.toggleBoard(selectedBoard);
                }
            }
            
            const _cachedAt = +(this.storageService.getItem("__block_at") || 0);

            // Cache only lives for 2 hours
            if (_cachedAt && _cachedAt < Date.now() - 1000 * 60 * 60 * 2) {
                this._clearBlocks();
            } else {
                const _cache = this.storageService.getItem("__block_thread_map");
                this.blockThreadMap = _cache && JSON.parse(_cache) || {};
            }
        }).then(() => {
            this.initalized = true;
            return this.getThreadsLoop();
        }).then(() => {
            this.loaderService.dec();
        });
    }

    public getThreadsFunc(board: string, page: number, delay: number=0): () => Promise<void> {
        return () => this.dataService.getThreads(board, page).then(threads => {
            this.loaderService.inc();

            for (const thread of threads) {
                if (this.blockThreadMap[thread.mainPostNo]) {
                    continue;
                }

                // Check if any updates were made to thread
                // If there were, add thread
                const oldThread = this.threadMap[thread.mainPostNo];

                if (oldThread) {
                    let changesFound = false;

                    for (let i = 0; i < thread.posts.length; i++) {
                        const post = thread.posts[i];
                        const oldPost = oldThread.posts[i];

                        if (post?.no !== oldPost?.no) {
                            changesFound = true;
                            break;
                        }
                    }

                    if (changesFound) {
                        if (oldThread.visibility) {
                            // If we haven't scrolled past the thread yet, let's just update the thread on the page
                            if (oldThread.visibility.topRatio < 1 || oldThread.visibility.bottomRatio > 1) {
                                // this.threadMap[thread.mainPostNo] = thread;

                                const oldPostsLength = oldThread.posts.length;

                                for (const post of thread.posts) {
                                    let postExistsAlready = false;

                                    for (let i = 0; i < oldPostsLength; i++) {
                                        const oldPost = oldThread.posts[i];

                                        if (post?.no === oldPost?.no) {
                                            postExistsAlready = true;
                                            break;
                                        }
                                    }
            
                                    if (!postExistsAlready) {
                                        // oldThread.posts.push(post);
                                        this.pushPost(oldThread, post);
                                    }
                                }

                                continue;
                            }
                        }

                        this.addThread(thread);
                    }

                    continue;
                }

                this.addThread(thread);
            }
        }).catch(error => {
            console.error(error);
            this._errorTrackerFunc('getThreadsFunc', error);

            if (!environment.production) {
                debugger;
            }
        }).then(() => {
            this.loaderService.dec();
            if (delay) {
                return new Promise(resolve => {
                    window.setTimeout(() => {
                        resolve();
                    }, delay);
                })
            }

            return;
        });
    }

    public toggleBoard(board: string): void {
        if (this.selectedBoardMap[board]) {
            this.selectedBoardMap[board] = false;

            for (let i = 0; i < this.selectedBoards.length; i++) {
                const _board = this.selectedBoards[i];

                if (_board === board) {
                    this.selectedBoards.splice(i, 1);
                    break;
                }
            }

            this._removeThreadsByBoard(board);
        } else {
            this.selectedBoardMap[board] = true;
            this.selectedBoards.push(board);
        }

        this.storageService.setItem('__cached_boards', JSON.stringify(this.selectedBoards));

        this.softReload();

        this.analytics('toggled_board', {
            'board': board,
        });
    }

    private _doThreadsLoopTimeout(): void {
        clearTimeout(this.getThreadsLoopTimeout);
        this.getThreadsLoopTimeout = window.setTimeout(() => {
            this.getThreadsLoop();
        }, this.threads.length ? 10 * 1000 : 1000);
    }

    public getThreadsLoop(): Promise<void> {
        clearTimeout(this.getThreadsLoopTimeout);

        if (this.threads.length > Math.min(720, this.boards.length * 120)) {
            this._doThreadsLoopTimeout();
        }

        const promiseFuncs: (() => Promise<any>)[] = [];

        let pages = [1];

        if (this.pagesToLoad) {
            pages = [];
            for (let i = 0; i < this.pagesToLoad; i++) {
                pages.push(this.pagesToLoad - i);
            }
        }

        for (const page of pages) {
            for (const board of this.selectedBoards) {
                promiseFuncs.push(this.getThreadsFunc(board, page, 0));
            }
        }

        const poolSize = Math.min(4, Math.floor(this.pagesToLoad * this.selectedBoards.length / 5));

        return this.promiseFuncPoolService.pool(promiseFuncs, poolSize).then(() => {
            this._doThreadsLoopTimeout();
        });
    }

    public getBoards(retryCount?: number): Promise<void> {
        return this.dataService.getBoards().then(boards => {
            this.boards = boards;
        }).catch(error => {
            console.error(error);
            this._errorTrackerFunc('getBoards', error);

            const _retryCount = retryCount || 0;

            return new Promise(resolve => {
                setTimeout(() => {
                    resolve();
                }, _retryCount * 1000 + 2000);
            }).then(() => {
                this.getBoards(_retryCount + 1);
            });
        });
    }

    public clearThreadsAbove(): void {
        let index = -1;

        for (let i = 0; i < this.threads.length; i++) {
            const thread = this.threads[i];

            if (!thread.visibility || thread.visibility.bottomRatio > 0) {
                break;
            }

            index = i;
        }

        // Includes the thread that is currently in view on the top
        this.threads = this.threads.slice(index + 2);

        this.softReload();

        this.analytics('cleared_threads_above');
    }

    public addThread(thread: Thread): void {
        this.threadMap[thread.mainPostNo] = thread;
        this.threads.push(thread);
    }

    public setThreads(threads: Thread[]): void {
        this.threads = [];

        for (const thread of threads) {
            this.addThread(thread);
        }

        this.softReload();
    }

    public toggleImage(post: Post, div?: HTMLDivElement): void {
        if (post.spoiler) {
            post.spoiler = false;
            return;
        }

        post.expanded = !post.expanded;

        if (div) {
            const _rBox = div.getBoundingClientRect();

            // Element vertical position relative to current scroll position on document
            const relativeY = _rBox.top;

            if (relativeY < 0) {
                div.scrollIntoView();
            }
        }

        this.scrollService.checkScroll();

        this.analytics('toggled_image', {
            'thread_no': post.resto || post.no,
            'post_no': post.no,
        });
    }

    private _removeThreadsByBoard(board: string): void {
        const threads = [];

        for (let i = 0; i < this.threads.length; i++) {
            const _thread = this.threads[i];

            if (_thread.board === board) {
                continue;
            }

            threads.push(_thread);
        }

        this.setThreads(threads);
    }

    private _removeThread(thread: Thread): void {
        const threads = [];

        for (let i = 0; i < this.threads.length; i++) {
            const _thread = this.threads[i];

            if (thread.mainPostNo === _thread.mainPostNo) {
                continue;
            }

            threads.push(_thread);
        }

        this.setThreads(threads);
    }

    public blockThread(thread: Thread): void {
        this.blockThreadMap[thread.mainPostNo] = true;
        this.storageService.setItem("__block_thread_map", JSON.stringify(this.blockThreadMap));
        this.storageService.setItem("__block_at", "" + Date.now());
        
        this._removeThread(thread);

        this.analytics('blocked_thread', {
            'thread_no': thread.mainPostNo,
            // 'page_name': pageName,
        });

        this.scrollService.checkScroll();
    }
    
    public closeThread(thread: Thread): void {
        const mostUpToDateVersion = this.threadMap[thread.mainPostNo] || thread;

        // Remove all versions of this thread if this was the most up to date version
        if (thread === mostUpToDateVersion) {
            this._removeThread(thread);
            return;
        }

        // If this wasn't the most up to date version, remove all but the most up to date version
        const threads = [];

        for (let i = 0; i < this.threads.length; i++) {
            const _thread = this.threads[i];

            if (mostUpToDateVersion !== _thread && mostUpToDateVersion.mainPostNo === _thread.mainPostNo) {
                continue;
            }

            threads.push(_thread);
        }

        this.setThreads(threads);

        this.scrollService.checkScroll();

        this.analytics('closed_thread', {
            'thread_no': thread.mainPostNo,
        });
    }

    public closeAllThreads(): void {
        this.threads = [];

        this.softReload();

        this.scrollService.checkScroll();

        this.analytics('closed_all_threads');
    }

    public softReload(): void {
        // Try to load more threads only if there's currently no threads
        if (this.initalized && !this.threads.length) {
            this.getThreadsLoop();
        }
    }

    private _clearBlocks(): void {
        this.blockThreadMap = {};
        this.storageService.setItem('__block_at', '');
        this.storageService.setItem('__block_thread_map', '');
    }

    public clearBlocks(): void {
        if (window.confirm("Clear cache?")) {
            this._clearBlocks();

            this.analytics('cleared_blocks');
        }
    }

    public loadFullPosts(thread: Thread): Promise<void> {
        thread.expanded = true;
        
        const mainPostNo = thread.mainPostNo;
        const board = thread.board;

        this.loaderService.inc();

        return this.dataService.getFullThread(board, mainPostNo).then(posts => {
            // Clear existing posts (removed since if the thread doesn't exist anymore, the posts will just be empty)
            // thread.posts = [];

            const ignorePostNoMap: {
                [no: number]: Post;
            } = {};

            for (const mainPost of thread.mainPosts) {
                ignorePostNoMap[mainPost.no] = mainPost;
            }

            for (const oldPost of thread.posts) {
                ignorePostNoMap[oldPost.no] = oldPost;
            }

            for (const post of posts) {
                if (!ignorePostNoMap[post.no]) {
                    // thread.posts.push(post);
                    this.pushPost(thread, post);
                }
            }

            thread.posts.sort((a, b) => {
                return a.time - b.time;
            });
        }).catch(error => {
            console.error(error);

            if (!environment.production) {
                debugger;
            }

            this.errorCount += 1;
        }).then(() => {
            this.loaderService.dec();

            this.analytics('loaded_full_posts', {
                'thread': thread.mainPostNo,
                // 'page_name': pageName,
            });

            this.scrollService.checkScroll();
        });
    }

    private _getThreadInView(): Thread | null {
        for (const thread of this.threads) {
            if (!thread.visibility) {
                continue;
            }

            if (thread.visibility.topRatio >= 1 && thread.visibility.bottomRatio >= .95) {
                return thread;
            }

            if (thread.visibility.topRatio < 0) {
                break;
            }
        }

        return null;
    }

    public pushPost(thread: Thread, post: Post): void {
        if (this.blockPostMap[thread.mainPostNo] && this.blockPostMap[thread.mainPostNo][post.no]) {
            return;
        }
        
        thread.posts.push(post);
    }

    public deletePost(thread: Thread, post: Post): void {
        for (let i = 0; i < thread.posts.length; i++) {
            const _post = thread.posts[i];
            if (post === _post) {
                thread.posts.splice(i, 1);
                break;
            }
        }

        this.blockPostMap[thread.mainPostNo] = this.blockPostMap[thread.mainPostNo] || {};
        this.blockPostMap[thread.mainPostNo][post.no] = true;

        this.analytics('closed_post', {
            'thread_no': thread.mainPostNo,
            'post_no': post.no,
        });

        this.scrollService.checkScroll();
    }

    public agreeToTermsFunc(): void {
        this.agreeToTerms = new Date().toString();
        this.storageService.setItem('__cached_agree_to_terms', this.agreeToTerms);
    }

    private _initalizeFirebase(): void {
        const firebaseConfig = {
            apiKey: "AIzaSyCWpnr99IP-97TkbYkCvui6C5MW0be9_ss",
            authDomain: "four-chan.firebaseapp.com",
            databaseURL: "https://four-chan.firebaseio.com",
            projectId: "four-chan",
            storageBucket: "four-chan.appspot.com",
            messagingSenderId: "684421693648",
            appId: "1:684421693648:web:9540e52aced7432663ded5",
            measurementId: "G-8D950L2QFF"
        };

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);

        // Start up analytics
        firebase.analytics();

        this.analytics('page_view', {
            'page_path': window.location.href || "(unknown)",
            // 'page_name': pageName,
        });
    }

    private _errorCountDown(): void {
        clearInterval(this._errorCountInterval);
        this._errorCountInterval = window.setInterval(() => {
            this.errorCount -= 1;

            if (!this.errorCount) {
                clearInterval(this._errorCountInterval);
            }
        }, 2500);
    }

    private _errorTrackerFunc(funcName: string, error: Error): void {
        this.errorCount += 1;
        if (this.errorCount > 5) {
            this.errorCount = 5;
        }

        this._errorCountDown();

        this.analytics('error', {
            'func_name': funcName,
            'error': error.message || "unknown",
        });
    }

    public setPagesToLoad(num: number): void {
        this.pagesToLoad = num;
        this.storageService.setItem('__cached_pages_to_load', "" + num);
    }

    private analytics(eventName: string, eventParams?: {[key: string]: any}): void {
        if (!environment.production) {
            // Skip analytics for local development
            return;
        }
        
        firebase.analytics().logEvent(eventName, eventParams);
    }

    public setShowFavButtons(show: boolean): void {
        this.favButtonService.showFavButtons = show;

        if (show) {
            this.storageService.setItem('__cached_show_fav_buttons', 'on');
        } else {
            this.storageService.setItem('__cached_show_fav_buttons', 'off');
        }
    }

    public ngOnDestroy(): void {
        clearTimeout(this.getThreadsLoopTimeout);

        this.scrollObserver?.unsubscribe();
        this._detachListeners && this._detachListeners();

        this.scrollService.detach();
        this.responsiveService.detach();
    }
}

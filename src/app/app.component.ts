import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { environment } from '@environment';
import { Subscription } from 'rxjs';

import { DataService, Post, Thread } from './services/data.service';
import { LoaderService } from './services/loader.service';

import { ScrollService } from './services/scroll.service';
import { StorageService } from './services/storage.service';

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

    public blockThreadMap: {
        [mainPostNo: number]: true;
    } = {};

    public threadMap: {
        [mainPostNo: number]: Thread;
    } = {};

    private getThreadsLoopTimeout?: number;

    public initalized: boolean = false;

    private _detachListeners?: () => void;

    constructor(private renderer: Renderer2, private dataService: DataService, 
        private storageService: StorageService, private scrollService: ScrollService, 
        public loaderService: LoaderService) {
    }

    public ngOnInit(): void {
        this.scrollService.init(this.renderer);
        this.scrollObserver = this.scrollService.observable.subscribe(value => {
            // console.log('APP', value);
        });

        // Handle getting screen height css variables
        const appHeight = () => {
            try {
                const doc = document.documentElement;

                const windowHeight = window.innerHeight;

                doc.style.setProperty('--app-height-100', `${windowHeight}px`);
                doc.style.setProperty('--app-height-95', `${windowHeight * .95}px`);
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

    public getThreads(board: string, full: boolean): Promise<void> {
        this.loaderService.inc();

        const promises: Promise<any>[] = [];

        let pages = [1];

        if (full) {
            pages = [2, 1];
        }

        for (const page of pages) {
            promises.push(this.dataService.getThreads(board, page).then(threads => {
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
                                            oldThread.posts.push(post);
                                        }
                                    }
    
                                    // for (let i = 0; i < this.threads.length; i++) {
                                    //     const _thread = this.threads[i];
    
                                    //     // Replace old _thread with new one
                                    //     if (thread.mainPostNo === _thread.mainPostNo) {
                                    //         this.threads[i] = thread;
                                    //     }
                                    // }
    
                                    continue;
                                }
                            }
    
                            this.addThread(thread);
                        }
    
                        continue;
                    }
    
                    this.addThread(thread);
                }
            }));
        }

        return Promise.all(promises).then(() => {
            // pass
        }).catch(error => {
            console.error(error);

            if (!environment.production) {
                debugger;
            }
        }).then(() => {
            this.loaderService.dec();
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

        if (!this.threads.length) {
            this.getThreadsLoop(true);
        }
    }

    public getThreadsLoop(full: boolean): Promise<void> {
        clearTimeout(this.getThreadsLoopTimeout);

        if (this.threads.length > 600) {
            this.getThreadsLoopTimeout = window.setTimeout(() => {
                this.getThreadsLoop(false);
            }, 10 * 1000);

            return Promise.resolve();
        }

        let promises: Promise<any>[] = [];

        for (let board of this.selectedBoards) {
            promises.push(this.getThreads(board, full));
        }

        return Promise.all(promises).then(() => {
            this.getThreadsLoopTimeout = window.setTimeout(() => {
                this.getThreadsLoop(false);
            }, 10 * 1000);
        });
    }

    public getBoards(): Promise<void> {
        return this.dataService.getBoards().then(boards => {
            this.boards = boards;
        });
    }

    public init(): void {
        this.loaderService.inc();

        const promises: Promise<any>[] = [];

        // if (this.dataService.isLocalRoot()) {
        //     promises.push(this.dataService.pingLocalServer().then(success => {
        //         if (!success) {
        //             console.warn("Local server ping wasn't successful, falling back to production root instead");
        //             this.dataService.setToProdRoot();
        //         }
        //     }));
        // }

        void Promise.all(promises).then(() => {
            const cachedBoards = this.storageService.getItem("__cached_boards");
            const selectedBoards = cachedBoards && JSON.parse(cachedBoards) || [];

            if (selectedBoards.length) {
                for (const selectedBoard of selectedBoards) {
                    this.toggleBoard(selectedBoard);
                }
            } else {
                // Choose to not show the board just yet. Instead we have a message to new viewers
                // this.showBoards = true;
            }
            
            const _cachedAt = +(this.storageService.getItem("__block_at") || 0);

            // Cache only lives for 2 hours
            if (_cachedAt && _cachedAt < Date.now() - 1000 * 60 * 60 * 2) {
                this._clearBlocks();
            } else {
                const _cache = this.storageService.getItem("__block_thread_map");
                this.blockThreadMap = _cache && JSON.parse(_cache) || {};
            }
            
            return this.getBoards();
        }).then(() => {
            this.initalized = true;
            return this.getThreadsLoop(true);
        }).then(() => {
            this.loaderService.dec();
        });
    }

    public clearThreads(): void {
        this.threads = [];
        // this.threadMap = {};
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

        this.threads = this.threads.slice(index + 1);

        if (!this.threads.length) {
            this.getThreadsLoop(true);
        }
    }

    public addThread(thread: Thread): void {
        this.threadMap[thread.mainPostNo] = thread;
        this.threads.push(thread);
    }

    public setThreads(threads: Thread[]): void {
        this.clearThreads();

        for (const thread of threads) {
            this.addThread(thread);
        }

        if (!this.threads.length) {
            this.getThreadsLoop(true);
        }
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
        
        this._removeThread(thread);
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
    }

    public closeAllThreads(): void {
        this.clearThreads();

        if (!this.threads.length) {
            this.getThreadsLoop(true);
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
        }
    }

    public loadFullPosts(thread: Thread): Promise<void> {
        thread.expanded = true;
        
        const mainPostNo = thread.mainPostNo;
        const board = thread.board;

        this.loaderService.inc();

        return this.dataService.getFullThread(board, mainPostNo).then(posts => {
            thread.posts = [];

            for (const post of posts) {
                let found = false;

                for (const mainPost of thread.mainPosts) {
                    if (mainPost.no === post.no) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    thread.posts.push(post);
                }
            }
        }).catch(error => {
            console.error(error);

            if (!environment.production) {
                debugger;
            }
        }).then(() => {
            this.loaderService.dec();
        });
    }

    public ngOnDestroy(): void {
        clearTimeout(this.getThreadsLoopTimeout);

        this.scrollObserver?.unsubscribe();
        this._detachListeners && this._detachListeners();
    }
}
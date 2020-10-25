import { Injectable, Renderer2 } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Visibility } from '@app/directives/scroll-listener.directive';

import { environment } from '@environment';

// /server/*
const LOCAL_ROOT = 'http://localhost:5001';// Used when running the server express app in parallel to this angular app running

// source: https://github.com/4chan/4chan-API/blob/master/pages/Endpoints_and_domains.md
// const FOUR_CHAN_ROOT = 'https://boards.4chan.org';// What is supposed to be the endpoint, but because of Redirects, browsers won't allow it

// source: https://github.com/gnuns/allOrigins
const ALL_ORIGINS_ROOT = `https://api.allorigins.win/get?charset=ISO-8859-1&url=${encodeURIComponent('https://boards.4chan.org')}`;// Workaround found online

export interface ParsedHtmlElement {
    tag: string;
    href?: string;
    class?: string;
    text?: string;
}

export type EscapedHTMLString = string;

export interface SimplifiedPage {
    page: number,
    threads: SimplifiedThread[],
}

export interface SimplifiedThread {
    no: number,
    last_modified: number,
    repies: number,
}

export interface Thread {
    board: string;
    mainPostNo: number;
    mainPosts: Post[];
    posts: Post[];
    visibility?: Visibility;
}

export interface Post {
    no: number;
    id: string;
    now: string;
    resto: number | null;
    sticky: boolean;
    closed: boolean;
    time: number;// CreatedAt
    tim: number | null;
    name: string;// Default is 'Anonymous'
    capcode: string | null;// mod, admin, admin_highlight, manager, developer, founder (optional => default is null)
    sub: string | null;
    com: EscapedHTMLString | null;
    m_img: string;
    filename: string;
    ext: string;// .jpg, .png, .gif, .pdf, .swf, .webm
    w: number;// Image width
    h: number;// Image height
    tn_w: number;// Thumbnail width
    tn_h: number;// Thumbnail height
    filedeleted: boolean;
    spoiler: boolean;

    thumbnailUrl: string | null;
    imageUrl: string | null;
    expanded: boolean;

    parsedHtml: ParsedHtmlElement[];
    htmlStrExpanded: boolean;

    board: string;
}

@Injectable({
    providedIn: 'root',
})
export class DataService {
    private _ROOT: string;

    constructor(private httpClient: HttpClient) {
        this._ROOT = LOCAL_ROOT;

        if (environment.production) {
            this._ROOT = ALL_ORIGINS_ROOT;
        }
    }

    public get(url: string): Promise<any> {
        const headers = new HttpHeaders({
            // 'Content-Type': 'application/json',
            // 'Accept': 'application/json',
            // 'Access-Control-Allow-Origin': '*',
            // 'Access-Control-Allow-Origin': 'a.4cdn.org',
            // 'Access-Control-Allow-Origin': 'https://a.4cdn.org',
            // 'Access-Control-Allow-Origin': 'boards.4chan.org',
            // 'Access-Control-Allow-Origin': 'https://boards.4chan.org',
            // 'Access-Control-Allow-Origin': 'api.allorigins.win',
            
            // 'Access-Control-Allow-Headers': 'Content-Type',
            // 'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
            // 'Access-Control-Allow-Headers': 'Origin, Content-Type, X-Auth-Token',
            // 'Access-Control-Allow-Methods': 'GET',
        });

        return this.httpClient.get(url, { 
            responseType: 'json', 
            headers: headers
        }).toPromise().then((res: any) => {
            let _res = res;

            if (res.contents) {
                _res = res.contents;
            }

            const json = typeof _res === 'string' ? JSON.parse(_res) : _res;
            return json;
        });
    }

    // source: https://github.com/4chan/4chan-API/blob/master/pages/Boards.md
    public getBoards(): Promise<string[]> {
        return this.get(`${this._ROOT}/boards.json`).then((res: any) => {
            console.log(res);

            if (!res || !res.boards || !Array.isArray(res.boards)) {
                return [];
            }

            const boards: string[] = [];

            for (const board of res.boards) {
                boards.push(board.board);
            }

            return boards;
        });
    }

    // source: https://github.com/4chan/4chan-API/blob/master/pages/Threadlist.md
    public getPages(board: string): Promise<SimplifiedPage[]> {
        return this.get(`${this._ROOT}/${board}/threads.json`).then((res: any) => {
            if (!res) {
                return [];
            }

            return res;
        }).catch(error => {
            console.error(error);
            debugger;

            return [];
        });
    }

    public getThreads(board: string, pageNo: number): Promise<Thread[]> {
        return this.get(`${this._ROOT}/${board}/${pageNo}.json`).then((res: any) => {
            if (!res || !res.threads || !Array.isArray(res.threads)) {
                return [];
            }

            const rawThreads = res.threads;

            const threads: Thread[] = [];

            for (const rawThread of rawThreads) {
                const thread: Thread = {
                    board: board,
                    mainPostNo: 0,
                    mainPosts: [],
                    posts: [],
                };

                if (!rawThread || !rawThread.posts || !Array.isArray(rawThread.posts)) {
                    thread.posts = [];
                    continue;
                }

                const posts = this.getPostsFromData(rawThread.posts, board);

                for (const post of posts) {
                    if (!post.resto || post.sticky || post.capcode) {
                        if (!thread.mainPostNo) {
                            thread.mainPostNo = post.no;
                        }
                        
                        thread.mainPosts.push(post);
                    } else {
                        thread.posts.push(post);
                    }
                }
                threads.push(thread);
            }

            return threads;
        });
    }

    // source: https://github.com/4chan/4chan-API/blob/master/pages/Threads.md
    public getFullThread(board: string, threadNO: number): Promise<Post[]> {
        return this.get(`${this._ROOT}/${board}/thread/${threadNO}.json`).then((res: any) => {
            if (!res || !res.posts || !Array.isArray(res.posts)) {
                return [];
            }
            
            const rawPosts = res.posts;

            let posts: Post[] = this.getPostsFromData(rawPosts, board);

            return posts;
        }).catch(error => {
            console.error(error);
            debugger;

            return [];
        });
    }

    public getPostsFromData(rawPosts: any[], board: string) {
        if (!rawPosts || !Array.isArray(rawPosts)) {
            return [];
        }

        let posts: Post[] = [];

        for (const rawPost of rawPosts) {
            const post: Post = {
                no: rawPost.no,
                id: rawPost.id,
                now: rawPost.now,
                resto: rawPost.resto || null,
                sticky: !!rawPost.sticky,
                closed: !!rawPost.closed,
                time: rawPost.time,
                name: rawPost.name,
                capcode: rawPost.capcode || null,// mod, admin, admin_highlight, manager, developer, founder (optional)
                sub: rawPost.sub || null,
                com: rawPost.com || null,
                tim: rawPost.tim || null,
                m_img: rawPost.m_img,
                filename: rawPost.filename,
                ext: rawPost.ext,// .jpg, .png, .gif, .pdf, .swf, .webm
                w: rawPost.w,// Image width
                h: rawPost.h,// Image height
                tn_w: rawPost.tn_w,// Thumbnail width
                tn_h: rawPost.tn_h,// Thumbnail height
                filedeleted: !!rawPost.filedeleted,
                spoiler: !!rawPost.spoiler,
                thumbnailUrl: rawPost.tim ? (`https://i.4cdn.org/${board}/${rawPost.tim}s.jpg`) : null,
                imageUrl: rawPost.tim ? (`https://i.4cdn.org/${board}/${rawPost.tim}${rawPost.ext}`) : null,
                expanded: false,
                parsedHtml: [],
                htmlStrExpanded: false,
                board: board,
            };

            post.parsedHtml = this.attachParsedHtmlElements(post);

            posts.push(post);
        }

        return posts;
    }

    public attachParsedHtmlElements(post: Post): ParsedHtmlElement[] {
        if (!post.com) {
            const empty: ParsedHtmlElement[] = [];

            post.parsedHtml = empty
            return empty;
        }

        const els: ParsedHtmlElement[] = [];

        const htmlStringArray = this.getArrayTagsHtmlString(post.com);

        let el: ParsedHtmlElement = {
            tag: 'span',
        };

        for (const part of htmlStringArray) {
            // Skip closing tags for anchors/spans
            if (part === '</a>' || part === '</span>') {
                continue;
            }

            if (part === '<br>') {
                el.tag = 'br';
                
                els.push(el);

                el = {
                    tag: 'span',
                };

                continue;
            }

            // Get the anchor attributes, add text on next iteration
            if (part.startsWith('<a')) {
                el.tag = 'a';

                const classMatch = part.match(/class="(.*?)"/);
                const classString = classMatch && classMatch[0] || '';
                el.class = classString ? (classString.substring(`class="`.length, classString.length - 1)) : undefined;

                const hrefMatch = part.match(/href="(.*?)"/);
                const hrefString = hrefMatch && hrefMatch[0] || '';

                // Assuming all hrefs are quotes, we can redirect to the site using the href
                const href = hrefString ? (hrefString.substring(`href="`.length, hrefString.length - 1)) : undefined;

                if (href) {
                    el.href = `https://boards.4chan.org/${post.board}/thread/${post.resto || post.no}${href}`;
                }

                continue;
            }

            // Get the span attributes, add text on next iteration
            if (part.startsWith('<span')) {
                el.tag = 'span';

                const classMatch = part.match(/class="(.*?)"/);
                const classString = classMatch && classMatch[0] || '';
                el.class = classString ? (classString.substring(`class="`.length, classString.length - 1)) : undefined;

                continue;
            }

            // If the text isn't a linebreak (<br>) or anchor <a .*>, then assume it is just text.
            // We will put this text inside a span (which is defaulted) or if we found an anchor, the current element should be an anchor
            el.text = this.htmlDecode(part);
            els.push(el);

            el = {
                tag: 'span',
            };
        }

        post.parsedHtml = els;
        return els;
    }

    public getArrayTagsHtmlString(str:string): string[] {
        // let element: 'span' | 'a' | 'br' = 'span';

        let current = '';

        const ary: string[] = [];

        for (let i = 0; i < str.length; i++) {
            const char = str[i];

            if (char === '>') {
                current += char;

                ary.push(current);

                current = '';

                continue;
            }

            if (char === '<') {
                if (current) {
                    ary.push(current);
                }

                current = '';
            }

            current += char;
        }

        ary.push(current);

        return ary;
    }

    public htmlDecode(str: string): string {
        if (!str) {
            return str;
        }

        var doc = new DOMParser().parseFromString(str, "text/html");
        return doc.documentElement.textContent || '';
    }
}

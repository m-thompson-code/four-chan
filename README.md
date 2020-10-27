# Auto Load Chan (FourChan)

demo: [Auto Loan Chan](https://four-chan.web.app/)

I started this project to improve my personal viewing experience of 4chan (the 'website') content. I wanted to see all the content (or pages) of a board and view all the boards I wanted at the same time without do more than scroll or swip. Growing up I knew of existing chrome extensions that gave me more feature than default 4chan, but instead of searching for some current to date ones, I decided to spend a day trying to create my own personal site (took longer than that obviously). The current end result gives me a better overall experience. 

The layout is more modern, I can view all my favorite boards on a single page without having to navigate switch between boards, interating between pages, or refresh the website to view updates. This application bundles all my expectations into a single page where the content auto updates.

Libaries/Frameworks: [Angular](https://github.com/angular/angular-cli), [Firebase Analytics](https://firebase.google.com/docs/analytics), [Express](https://expressjs.com/), and [Axios](https://github.com/axios/axios)

Key ingredient: [4 Chan API](https://github.com/4chan/4chan-API)

Hosting: [Firebase Hosting](https://firebase.google.com/docs/hosting), [Heroku](https://www.heroku.com/)

other: [AllOrigins](https://github.com/gnuns/allOrigins)

If you're new to Angular stuff, check out their docs on [getting started](https://angular.io/start) then move on to their [build process](https://angular.io/guide/deployment#basic-deployment-to-a-remote-server). For deployment, you might want to look into [Firebase](https://firebase.google.com/) and [Heroku](https://www.heroku.com/) (optiona) (both have free tiers)

## Dev

`npm run start` - Local Angular application

`npm run start-server` - Local Express server (optional)

## Build

The `deploy` commands mentioned after this section run the needed `build` commands shown below. For reference, here they are.

`npm run build` - Production Angular application

`npm run build-server` - Production Express server (optional)

## Deploy

I've deployed the application using [Firebase Hosting](https://firebase.google.com/docs/hosting) and deployed the server (optional) using [Heroku](https://www.heroku.com/).

If you try to deploy without changing any code, you'll likely get an error for missing certs for Firebase or Heroku.

To deploy the web application, you'll want to to start your own [Firebase project](https://firebase.google.com/docs/hosting) for hosting and if you want analytics, update [/src/app.component.ts](https://github.com/m-thompson-code/four-chan/blob/1.0.1/src/app/app.component.ts#L588) with your own config for firebase (optional).

For the server (optional), you'll need to use Heroku (they have a [free tier](https://firebase.google.com/docs/hosting)) and host the server. Here's a hopefully useful [tutorial](https://devcenter.heroku.com/articles/getting-started-with-nodejs#set-up). I skimmed through it and it seemed to answer the questions I had when hosting a server on Heroku for the first time. If you got questions, submit an issue or contact me via email.

`npm run deploy` - Deploys production Angular application using Firebase Hosting

`npm run deploy-server` - Deploys production Express server using Heroku (optional)

## 4 Chan API

4 Chan has a [public API](https://github.com/4chan/4chan-API). Sadly most modern browsers don't allow prelight COR when url involves a [redirect](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#Preflighted_requests_and_redirects), and this was a problem for me getting this project working. All of the public [end points](https://github.com/4chan/4chan-API#getting-started) for 4 Chan redirect from boards.4chan.org to a.4cdn.org. 

To remedy this issue, the server of this project hits these end points for the client application to avoid any CORS issues. On top of that, I found a solution with [AllOrigins](https://github.com/gnuns/allOrigins) which is explained after this section. The 4Chan API gives anyone anything they would need to recreate their 4 Chan experience and is the root of this project. So good on them. Thank you 4 Chan Team :)

## AllOrigins

[AllOrigins](https://github.com/gnuns/allOrigins) is a general CORS [solution](https://allorigins.win/) where you can pass a url to their website and get the response of that url without worrying about the CORS issues. Using their website gave me a first line of defense to handling making GET requests to the 4 Chan API without falling prey to CORS problems. 

## Application <-> 4 Chan API and why have a server?

The client application would normally just hit the 4 Chan API directly, but because of the CORS issues involved, the client application goes through these workarounds in this order:

1. [http://localhost:5001](https://github.com/m-thompson-code/four-chan/blob/1.0.1/src/app/services/data.service.ts#L91) if you're running the project locally (this step is skipped on production)
2. [AllOrigin](https://github.com/m-thompson-code/four-chan/blob/1.0.1/src/app/services/data.service.ts#L141)
3. [Heroku](https://github.com/m-thompson-code/four-chan/blob/1.0.1/src/app/services/data.service.ts#L150)


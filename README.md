##NodeJS Against Humanity

<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/2.0/"><img alt="Creative Commons License" style="border-width:0" src="http://i.creativecommons.org/l/by-nc-sa/2.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/2.0/">Creative Commons Attribution-NonCommercial-ShareAlike 2.0 Generic License</a>.

NodeJS implementation of Cards Against Humanity. Here's a screenshot:

<img src="/nodejs-against-humanity.png" />

##Run Locally

Install all the dependencies:

    npm install (you may need to prefix this with sudo if you're on Mac)

Run the app:

    node server.js

Then navigate to `http://localhost:3000`

If you want tests to execute every time you change a file:

    jasmine-node ./spec/describe_Game_spec.js --autotest --watch ./game.js

To run the E2E tests you first must install protractor. see: https://github.com/angular/protractor/blob/master/docs/getting-started.md

If you want the server to load up everytime you change the back end:

    npm install -g nodemon

Then run the following instead of `node server.js`:

    nodemon server.js

##Signing up, and deploying to Heroku

###Documentation

From heroku.com, click Documentation, then click the Getting Started button, then click Node.js from the list of options on the left...which will take you here: https://devcenter.heroku.com/articles/nodejs

Install Heroku toolbelt from here: https://toolbelt.heroku.com/

Sign up via the website (no credit card required).

Login using the command line tool:

    heroku login

Create your heroku app:

    heroku create

Git deploy your app:

    git push heroku master

Open the app (same as opening it in the browser):

    heroku open

And your app should be up on Heroku.

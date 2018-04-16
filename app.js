/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);
bot.set('storage', tableStorage);

bot.dialog('/', [
    // function (session) {
    //     builder.Prompts.text(session, "Hello... What's your name?");
    // },
    // function (session, results) {
    //     session.userData.name = results.response;
    //     builder.Prompts.number(session, "Hi " + results.response + ", How many years have you been coding?"); 
    // },
    // function (session, results) {
    //     session.userData.coding = results.response;
    //     builder.Prompts.choice(session, "What language do you code Node using?", ["JavaScript", "CoffeeScript", "TypeScript"]);
    // },
    // function (session, results) {
    //     session.userData.language = results.response.entity;
    //     session.send("Got it... " + session.userData.name + 
    //                 " you've been programming for " + session.userData.coding + 
    //                 " years and use " + session.userData.language + ".");
    // }
    
    function (session) {
        // prompt for search option
        builder.Prompts.choice(
            session,
            'Are you looking for a flight or a hotel?',
            [DialogLabels.Flights, DialogLabels.Hotels, DialogLabels.Support],
            {
                maxRetries: 3,
                retryPrompt: 'Not a valid option'
            });
            // "Hotels|Flights|Support", { listStyle: builder.ListStyle.button });
    },
    
    function (session, result) {
        if (!result.response) {
            // exhausted attemps and no selection, start over
            session.send('Ooops! Too many attemps :( But don\'t worry, I\'m handling that exception and you can try again!');
            return session.endDialog();
        }

        // on error, start over
        session.on('error', function (err) {
            session.send('Failed with message: %s', err.message);
            session.endDialog();
        });

        // continue on proper dialog
        var selection = result.response.entity;
        switch (selection) {
            case DialogLabels.Flights:
                return session.beginDialog('flights');
            case DialogLabels.Hotels:
                return session.beginDialog('hotels');
            case DialogLabels.Support:
                return session.beginDialog('support');
        }
    }
]);

bot.dialog('flights', [
    // function (session) {
    //     session.send("You choice Flights!");
        
    // },
    
        (session)=> {
            builder.Prompts.text(session, 'What is your name?');
        },
        (session, results)=> { 
            session.endDialog(`Hello, ${results.response}`);
        }
    ]
);
bot.dialog('hotels', [
    function (session) {
        session.send("You choice Hotels!");
        session.endDialog();
    }
]
);
bot.dialog('support', [
    function (session) {
        session.send("How can I Help you!");
        session.endDialog();
    }
]
);

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
var DialogLabels = {
    NewUser: 'Registrar cuenta',
    Unlock: 'Desbloquear Cuenta',
    NewPass: 'Nueva Contraseña',
    Registry: 'Registrar Equipo'
};
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
            'Hola en que puedo ayudarte',
            [DialogLabels.NewUser, DialogLabels.Unlock, DialogLabels.NewPass, DialogLabels.Registry],
            {
                maxRetries: 3,
                retryPrompt: 'Por favor, elige una opción válida'
            });
            // "Hotels|Flights|Support", { listStyle: builder.ListStyle.button });
    },
    
    function (session, result) {
        if (!result.response) {
            // exhausted attemps and no selection, start over
            session.send('Uuups! demasiados intentos fallidos, :( pero no te preocupes, puedes intentarlo de nuevo!');
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
            case DialogLabels.NewUser:
                return session.beginDialog('newuser');
            case DialogLabels.Unlock:
                return session.beginDialog('unlock');
            case DialogLabels.NewPass:
                return session.beginDialog('newpass');
            case DialogLabels.Registry:
                return session.beginDialog('registry');
        }
    }
]);
bot.dialog('newuser', [
       
    function(session){
        builder.Prompts.text(session, '¿Cuál es tu cuenta de correo? (ejemplo: usuario32@mainbit.com.mx)');
    },
    function(session, results){ 
        session.endDialog(`Hola, la cuenta ${results.response} ha sido registrada correctamente.`);
    }
]
);

bot.dialog('unlock', [
function(session){
    builder.Prompts.text(session, '¿Cuál es la cuenta que deseas desbloquear? (ejemplo: usuario32@mainbit.com.mx)');
},
function(session, results){ 
    session.endDialog(`Hola, la cuenta ${results.response} ha sido desbloqueada correctamente.`);
}
]
);

bot.dialog('newpass', [
function(session) {
    builder.Prompts.text(session, '¿Cuál es la cuenta de correo? (ejemplo: usuario32@mainbit.com.mx)');
},
function(session, results){ 
    session.endDialog(`Hola, la nueva contraseña para la cuenta ${results.response} es: ZxU81LmT`);
}
]
);

bot.dialog('registry', [
function(session){
    builder.Prompts.choice(
        session,
        'Hola en que puedo ayudarte',
        [DialogLabels.NewUser, DialogLabels.Unlock, DialogLabels.NewPass, DialogLabels.Registry],
        {
            maxRetries: 3,
            retryPrompt: 'Por favor, elige una opción válida'
        });
}
]
);

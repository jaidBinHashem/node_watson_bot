var express = require('express'), bodyParser = require('body-parser'), request = require('request'), app = express().use(bodyParser.json());
var ConversationV1 = require('watson-developer-cloud/conversation/v1');

//token for facebook app
const app_token = 'EAAbnH2RGIhYBAPUToCP5HUhl0gYCzMUtL9na3JpZB1B54TxuAr4dKY1wGPQetLj7YMS7eaerayEV3z1aZABkxFPtQCSDQf8HKP4iBgIgVmlT6pVEgRzH1NGPSQAWKZB0CDEX5d99vYY4Q3lHDZB0xDtez9Jj5hs3S4vYC93XmwZDZD';

//app will listen to port 5000
app.listen(process.env.PORT || 5000, () => console.log('webhook is listening'));

/*Facebook Validation for the app*/
app.get('/webhook', (req, res) => {
    if (req.query['hub.mode'] && req.query['hub.verify_token'] === 'sync_bot') {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.status(403).end();
    }
});

/* Handling all messenges */
app.post('/webhook', (req, res) => {
    if (req.body.object === 'page') {
        req.body.entry.forEach((entry) => {
            if (entry.messaging) {
                console.log(entry.messaging[0].message.text);
                /*call sendMessage to send message back*/
                sendMessage(entry.messaging[0]);
            } else {
                console.log(entry);
            }
        });
        res.status(200).end();
    }
});

var contexts = [];

/* send message to facebook api*/
function sendMessage(event) {

    var context = null;
    var index = 0;
    var contextIndex = 0;
    contexts.forEach(function (value) {
        if (value.from == event.sender.id) {
            context = value.context;
            contextIndex = index;
        }
        index = index + 1;
    });
    console.log(context);

    var conversation = new ConversationV1({
        username: 'bc85a07e-f0ad-426e-9e7a-a4f25f88e270',
        password: 'IAfQ3zRJEw1i',
        version_date: ConversationV1.VERSION_DATE_2017_05_26
    });

    conversation.message(
        {
            input: { text: event.message.text },
            workspace_id: 'cccc867b-b508-4cab-83e8-7c501ce1ad10',
            context: context
        },
        function (err, response) {
            if (err) {
                console.error(err);
            } else {
                // console.log(JSON.stringify(response, null, 2));
                if (context == null) {
                    contexts.push({ 'from': event.sender.id, 'context': response.context });
                } else {
                    contexts[contextIndex].context = response.context;
                }

                if (response.intents.length > 0) {
                    console.log(response.intents);
                    var intent = response.intents[0].intent;
                }
                //   console.log(intent);
                request({
                    url: 'https://graph.facebook.com/v2.11/me/messages',
                    qs: { access_token: app_token },
                    method: 'POST',
                    json: {
                        recipient: { id: event.sender.id },
                        message: { text: response.output.text[0] }
                    }
                }, function (error, response) {
                    if (error) console.log('Error sending message: ', error);
                    else if (response.body.error) console.log('Error: ', response.body.error);
                });
            }
        }
    );
}
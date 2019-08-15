let express = require('express');
let app = express();
let bodyParser = require('body-parser');
let request = require('request-promise');

let PORT = process.env.PORT || 1234;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let callSendAPI = (access_token, sender_psid, response) => {
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  };

  return request('https://graph.facebook.com/v2.6/me/messages', {
    qs: { access_token },
    method: POST,
    json: request_body
  });
}

app.use('/webhook', async(req, res) => {
  if (!req.query) return res.status(500).send();

  let challenge = req.query['hub.challenge'];
  if (challenge) return res.send(challenge);

  if (!req.body || !req.query.access_token)
    return res.status(500).send();

  let { url, access_token } = req.query;

  let { body } = req;

  if (url) {
    let sender_psid = body.entry[0].messaging[0].sender.id;

    let res = await request(req.query.url, {
      form: body,
      qs: { access_token }
    });

    if (res !== 'EVENT_RECEIVED') {
      callSendAPI(access_token, sender_psid, { text: res });
    }

    return;
  }

  return res.send('EVENT_RECEIVED');
});

app.use('/test', (req, res) => {
  return res.send('Yay it works');
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
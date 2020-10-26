import * as express from 'express';
import * as cors from 'cors';
import axios from 'axios';

const ROOT = 'https://boards.4chan.org';

const app = express();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

app.get('ping', async (req: express.Request, res: express.Response) => {
    return res.status(200).type('json').send({
        message: 'ping success',
    });
});

app.get('**', async (req: express.Request, res: express.Response) => {
    const subPath = req.path.charAt(0) === '/' ? req.path : `/${req.path}`;

    const fullPath = `${ROOT}${subPath}`;

    console.log(fullPath);

    return axios.get(fullPath).then(_res => {
        return res.status(200).type('json').send(_res?.data);
    }).catch(error => {
        console.error('error on', fullPath);

        if (error.response) {
            console.error(error.response.data);
            console.error(error.response.status);
            console.error(error.response.headers);

            return res.status(error.response.status).send(error.response.data);
        }

        console.error(error);

        return res.status(500).send({
            error: error.message || "Unexpected error",
        });
    });
});

function run(): void {
    const port = process.env.PORT || 5001;
  
    // Start up the Node server
    app.listen(port, () => {
      console.log(`4chan api Express server listening on http://localhost:${port}`);
    });
}

run();

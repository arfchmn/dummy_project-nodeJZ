import cors from "cors"

const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,POST,DELETE',
    credentials: true
};

const corsMiddleware = cors(corsOptions);
export default corsMiddleware
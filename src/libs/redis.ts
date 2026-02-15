import { createClient } from "redis";

const redisClient = createClient({
  username: 'default',
  password: '3AmYdM9mRkfXedtyCOJOc2U3d9wm8Slv',
  socket: {
    host: 'redis-12852.c270.us-east-1-3.ec2.cloud.redislabs.com',
    port: 12852
  }
});

redisClient.on("error", (err) => console.error("Redis Error:", err));

const connectRedis = async () => {
  await redisClient.connect();
};

connectRedis();

export default redisClient;
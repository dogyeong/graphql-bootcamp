import { GraphQLServer, PubSub } from 'graphql-yoga';
import Query from './resolvers/Query';
import Mutation from './resolvers/Mutation';
import Post from './resolvers/Post';
import User from './resolvers/User';
import Comment from './resolvers/Comment';
import Subscription from './resolvers/Subscription';
import prisma from './prisma';

const pubsub = new PubSub();

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers: {
    Query,
    Mutation,
    Subscription,
    Post,
    User,
    Comment,
  },
  context: {
    pubsub,
  },
});

// prisma.mutation.createUser({ data: { name: 'lee', email: 'lee@naver.com' } }, '{ id name email }').then(console.log);
// prisma.query.users(null, '{ id name email }').then(console.log);

server.start(() => {
  console.log('server is up');
});
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";

import { typeDefs } from "./schema.js";
import _db from "./_db.js";

const PORT = process.env.PORT || 1337;

// A map of functions which return data for the schema.
const resolvers = {
  Query: {
    games: () => {
      return _db.games;
    },
    game: (_, args, context) => {
      const id = args.id;
      return _db.games.find((game) => game.id === id);
    },
    authors: () => {
      return _db.authors;
    },
    author: (_, args, context) => {
      const id = args.id;
      return _db.authors.find((author) => author.id === id);
    },
    reviews: () => {
      return _db.reviews;
    },
    review: (_, args, context) => {
      const id = args.id;
      return _db.reviews.find((review) => review.id === id);
    },
  },
  Game: {
    reviews: (parent, args, context) => {
      const gameId = parent.id;
      return _db.reviews.filter((review) => review.game_id === gameId);
    },
  },
  Author: {
    reviews: (parent, args, context) => {
      const authorId = parent.id;
      return _db.reviews.filter((review) => review.author_id === authorId);
    },
  },
  Review: {
    author: (parent, args, context) => {
      const authorId = parent.author_id;
      return _db.authors.find((author) => author.id === authorId);
    },
    game: (parent, args, context) => {
      const gameId = parent.game_id;
      return _db.games.find((game) => game.id === gameId);
    },
  },
  // Mutation
  Mutation: {
    deleteGame: (_, args) => {
      const gameId = args.id;
      _db.games = _db.games.filter((g) => g.id !== gameId);

      return _db.games;
    },
    addGame: (_, args) => {
      let game = {
        ...args.game,
        id: Math.floor(Math.random() * 10000).toString(),
      };
      _db.games.push(game);

      return game;
    },
    updateGame: (_, args) => {
      _db.games = _db.games.map((game) => {
        if (game.id === args.id) {
          return {
            ...game,
            ...args.updateGameDto,
          };
        }
        return game;
      });

      return _db.games.find((game) => game.id === args.id);
    },
  },
};

/*
* Apollo do the rest
games {
  title
}
*/

const app = express();
const httpServer = http.createServer(app);

// Set up Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
await server.start();

app.use(cors(), bodyParser.json(), expressMiddleware(server));

await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
console.log(`🚀 Server is ready at http://localhost:${PORT}`);

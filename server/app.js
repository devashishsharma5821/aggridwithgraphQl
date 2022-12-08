const express = require("express");
const bodyParser = require("body-parser");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
require("dotenv").config();
const Event = require("./models/event.js");
const app = express();
const  cors  = require("cors")

app.use(bodyParser.json());
app.use(cors())
app.use(
  "/graphql",
  graphqlHTTP({
    schema: buildSchema(`

    type Event {
      _id: ID!
      title: String!
      description: String!
      price: Float!
      date: String!
        }

        input EventInput {
          title: String!
          description: String!
          price: Float!
          date: String!
        }
        
        input UpdateEventInput {
          _id: ID!
          title: String!
          description: String!
          price: Float!
          date: String!
        }

        type RootQuery {
            events: [Event!]!
          }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
            deleteEvent(_id : String!): [Event]
            updateEvent(updateEventInput: UpdateEventInput) : Event
        }

        schema {
            query: RootQuery
            mutation: RootMutation
          }
          `),
    rootValue: {
      events: () => {
        return Event.find()
          .then((events) => {
            return events.map((event) => {
              return { ...event._doc, _id: event._doc._id.toString() };
            });
          })
          .catch((err) => {
            console.log(err);
            throw err;
          });
      },
      createEvent: (args) => {
        const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: +args.eventInput.price,
          date: new Date(args.eventInput.date),
        });

        return event
          .save()
          .then((result) => {
            console.log(result);
            return { ...result._doc, _id: event.id };
          })
          .catch((err) => {
            console.log(err);
            throw err;
          });
      },

      deleteEvent: (args) => {
        const id = mongoose.Types.ObjectId(args._id);
        Event.findByIdAndRemove(id)
          .then((event) => {
            console.log(event);
          })
          .catch((err) => {
            console.log(err);
          });
        return Event.find()
          .then((events) => {
            return events.map((event) => {
              return { ...event._doc, _id: event._doc._id.toString() };
            });
          })
          .catch((err) => {
            console.log(err);
            throw err;
          });
      },

      updateEvent: (args) => {
        const ID = mongoose.Types.ObjectId(args.updateEventInput._id);
        console.log(ID);
        console.log(args)

       return Event.findById(ID).then((updateEvent)=> {
          console.log(updateEvent)
          updateEvent.title = args.updateEventInput.title
          updateEvent.price = args.updateEventInput.price
          updateEvent.description = args.updateEventInput.description
          updateEvent.date = args.updateEventInput.date

          updateEvent.save()
          return updateEvent;
        }).catch((err)=> {
             console.log(err)
             throw err;
        })
      },
    },
    graphiql: true,
  })
);

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.kfdrasv.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority` )
  .then(() => {
    app.listen(4000, () => console.log("Now browse to localhost:4000/graphql"));
  })
  .catch((err) => console.log(err));

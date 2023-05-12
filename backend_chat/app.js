require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const io = require('socket.io')(5050, {
  cors:{
    origin: 'http://localhost:3000',
  }
});

//Middlewear

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//DB connection
const port = process.env.PORT || 5000;

//socket.io
let users = [];
io.on('connection',socket =>{
  console.log('User Connected', socket.id);
  socket.on('addUser', userId =>{
    const doesUserExist = users.find(user=> user.userId === userId);
    if(!doesUserExist){
      const user = {userId, socketId: socket.id}
      users.push(user);
    }
    io.emit('getUsers', users);
  })

  socket.on('sendMessage', async ({conversationId, senderId, receiverId, message})=>{
    const receiver = await users.find(user=> user.userId === receiverId);
    const sender = await users.find(user => user.userId === senderId);
    if(receiver){
      io.to(receiver.socketId).to(sender.socketId).emit('getMessage',{
        conversationId,
        senderId,
        message,
        receiverId
      })
    }else{
      io.to(sender.socketId).emit('getMessage',{
        conversationId,
        senderId,
        message,
        receiverId
      })
    }
  })
  
  socket.on('disconnect',()=>{
    users = users.filter(user => user.socketId !== socket.id)
    io.emit('getUsers',users);
  })
})

const url = `mongodb+srv://sujaypaul755:19QKoVINv6cdSLfS@cluster0.lrru8ma.mongodb.net/?retryWrites=true&w=majority`
mongoose.set("strictQuery", false);
mongoose.connect(url,{
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("DB CONNECTED");
});

//Import files

const User = require("./models/user");
const Conversation = require("./models/conversation");
const Message = require("./models/message");

//Routes

app.get("/", (req, res) => {
  res.send("Hello this is server");
});

// Signup route
app.post("/api/signup", (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).send("Please fill all required fields");
  } else {
    User.findOne({ email }).then((user) => {
      if (user) {
        return res.status(400).send("Email already exists");
      }
    });

    const user = new User({ fullName, email });
    bcrypt.hash(password, 10, function (err, hashed) {
      if (err) {
        return res.status(400).send("Problem in saving password");
      }
      user.set("password", hashed);
      user
        .save()
        .then((user) => {
          return res.status(200).send(user);
        })
        .catch((err) => console.log(err));
    });
  }
});

//Signin route
app.post("/api/signin", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Please fill all required fields");
  }

  User.findOne({ email }).then((user) => {
    if (!user) {
      return res.status(400).send("Email doesn't exist");
    }
    bcrypt.compare(password, user.password)
    .then(valid=>{
      if (!valid) {
        return res.status(400).send("Incorrect password");
      }
    if (valid) {
      const payload = {
        userId: user._id,
        email: user.email,
      };
      jwt.sign(
        payload,
        process.env.SECRET_KEY,
        { expiresIn: 85000 },
        (err, token) => {
          if (err) {
            {
              console.log(err);
            }
          }
          User.updateOne({ _id: user._id }, { $set: { token } }).then(
            (updatedUser) => {
              user.save().then((updatedUser) => {
                return res
                  .status(200)
                  .json({
                    user: {
                      id: updatedUser._id,
                      fullName: updatedUser.fullName,
                      email: updatedUser.email,
                    },
                    token,
                  });
              });
            }
          );
        }
      );
    }
    })
     
  });
});

app.post('/api/conversation', async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    const oldconversation = await Conversation.find({ members: [senderId, receiverId] });
    const oldconversation_c = await Conversation.find({ members: [receiverId,senderId] });
    if(senderId === receiverId){
      return res.status(400).json({message: 'You can not chat with own'})
    }
    else if (oldconversation.length === 0 && oldconversation_c.length === 0) {
      const newConversation = new Conversation({ members: [senderId, receiverId] });
      const resData = await newConversation.save();
      return res.status(200).json({ message: 'Conversation created successfully', id: resData._id });
    } else {
      if(oldconversation.length !== 0){
        return res.status(200).json({ message: 'Conversation already exists', id: oldconversation[0]._id })
      }else{
        return res.status(200).json({ message: 'Conversation already exists', id: oldconversation_c[0]._id })
      }
    }
  } catch (error) {
    console.log(error);
    // Handle the error and send an appropriate response
    return res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/api/conversation/:userId', async (req,res)=>{
  try {
    const userId = req.params.userId;
    const conversations = await Conversation.find({members: {$in: [userId]}}).then();
    const conversationUserData = await Promise.all(conversations.map(async(conversation)=>{
      const receiverId = conversation.members.find((member)=> member !== userId);
      const user = await User.findById(receiverId);
      return {user: {id: receiverId, email: user.email, fullName: user.fullName }, conversationId: conversation._id}
    }))
    return res.status(200).json(conversationUserData);
  } catch (error) {
    console.log(error);
  }
})

app.post('/api/message', async (req, res) => {
  try {
    const { conversationId, senderId, message, receiverId } = req.body;
    if (!senderId || !message) {
      return res.status(400).send('Please fill all required fields');
    } else if (!conversationId && receiverId) {
      const newConversation = new Conversation({ members: [senderId, receiverId] });
      await newConversation.save();
      const newMessage = new Message({ conversationId: newConversation._id, senderId, message });
      await newMessage.save();
      return res.status(200).json({success:'Message sent successfully'});
    } else if (conversationId && senderId && message) {
      const newMessage = new Message({ conversationId, senderId, message });
      await newMessage.save();
      return res.status(200).json({success:'Message sent successfully'});
    } else {
      return res.status(400).json({error:'Please fill all required fields'});
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({error:'Please fill all required fields'});
  }
});


app.get('/api/message/:conversationId', async (req,res)=>{
  try {
    const conversationId = req.params.conversationId;
    if(conversationId === 'new') return res.status(200).json([]);
    const messages = await Message.find({conversationId}).then();
    const messageUserData = Promise.all(messages.map(async (message)=>{
      const user = await User.findById(message.senderId);
      return {user: {id: user._id, email: user.email, fullName: user.fullName}, message: message.message}
    }));
    return res.status(200).json(await messageUserData);
  } catch (error) {
    console.log(error);
  }
})

app.get('/api/users',async (req,res)=>{
  try {
    const users = await User.find().then();
    const usersData = Promise.all(users.map(async (user)=>{
      return {user: {email: user.email, fullName: user.fullName}, userId: user._id}
    }))
    return res.status(200).json(await usersData)
  } catch (error) {
    console.log(error);
  }
})


app.listen(port, () => {
  console.log("Server is running");
});



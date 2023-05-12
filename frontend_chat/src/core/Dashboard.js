import React, { useEffect, useRef, useState } from "react";
import Avatar from "../assets/avatar.jpg";
import Avatar2 from "../assets/avatar2.svg";
import Call8 from "../assets/call8.png";
import Input from "../components/Input";
import Send from "../assets/send1.png";
import Add1 from "../assets/add.png";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const Dashboard = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user:details"))
  );

  const [globalUser, setGlobalUser] = useState(user);

  const [chatData, setChatData] = useState({
    user: {
      fullName: "Receiver",
      id: '',
      email: ''
    },
  });
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);

  const [typedMessage, setTypedMessage] = useState("");

  const [dependency, setDependency] = useState(1);

  const [socket, setSocket] = useState(null);

  const messageRef = useRef();

  useEffect(()=>{
    setSocket(io('https://chat-app2-red.vercel.app:5050'))
  },[])

  useEffect(()=>{
    socket?.emit('addUser',user?.id);
    socket?.on('getUsers',users=>{
      console.log('activeUsers => ', users);
    })
    socket?.on('getMessage', data=>{
      let sender = {};
if(data.senderId === chatData?.user?.id){
  sender = chatData.user
}else if(data.senderId === user?.id){
  sender = user
}

      console.log('data:=> ',data);
      setMessages(prev => [...prev, { user: sender, message: data.message }]);
    })

  },[socket])

  useEffect(()=>{
    messageRef?.current?.scrollIntoView({ behaviour: 'smooth'})
  },[messages])

  useEffect(() => {
    socket?.emit('addUser', user?.id);
  
    return () => {
      socket?.emit('addUser', user?.id); // Send the addUser event again on disconnect
    };
  }, [socket, user?.id]);
  

  const fetchUsers = async () => {
    const response = await fetch(`https://chat-app2-red.vercel.app:5000/api/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const responseData = await response.json();
    setUsers(responseData);
  };

  const createConversation = async ({ newUser, userId }) => {
    const response = await fetch(`https://chat-app2-red.vercel.app:5000/api/conversation`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        senderId: user?.id,
        receiverId: userId,
      }),
    });

    const responseData = await response.json();
    fetchMessages({ conversationId: responseData.id, user: newUser });
  };

  const fetchMessages = async ({ conversationId, user }) => {
    setChatData({ conversationId, user });
    const response = await fetch(
      `https://chat-app2-red.vercel.app:5000/api/message/${conversationId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const responseData = await response.json();
    setDependency(Math.random());
    setMessages(responseData);
  };

  const fetchConversations = async () => {
    const response = await fetch(
      `https://chat-app2-red.vercel.app:5000/api/conversation/${user.id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const responseData = await response.json();
    setConversations(responseData);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    socket?.emit('sendMessage', {
      conversationId: chatData?.conversationId,
      senderId: user?.id,
      message: typedMessage,
      receiverId: chatData.user.id,
    })
    const response = await fetch(`https://chat-app2-red.vercel.app:5000/api/message`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationId: chatData?.conversationId,
        senderId: user?.id,
        message: typedMessage,
        receiverId: chatData.user.id,
      }),
    });

    const responseData = await response.json();
    console.log(responseData);
    setTypedMessage("");
  };

  useEffect(() => {
    fetchConversations();
  }, [dependency]);

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="bg-blue-100 flex justify-center items-center">
      <div className="w-full flex flex-row">
        <div className="w-1/4 bg-slate-50">
          <div className="flex mx-14 items-center my-5 cursor-pointer">
            <div className="border border-green-500 rounded-full p-1">
              <img src={Avatar} className="w-14" alt="#" />
            </div>
            <div className="ml-8">
              <h4 className="text-xl">{user?.fullName}</h4>
              <p className="text-sm font-light">My Account</p>
            </div>
          </div>
          <hr />
          <div>
            <div className="mx-14 font-semibold text-blue-800 pt-2">
              Messages
            </div>
            <div>
              {conversations.length > 0 ? (
                conversations.map(({ conversationId, user }) => (
                  <div className="flex items-center mx-14 py-3 border-b border-b-gray-300 overflow-y-scroll">
                    <div
                      className="cursor-pointer flex items-center"
                      onClick={() => fetchMessages({ conversationId, user })}
                    >
                      <div className="border border-purple-500 rounded-full p-1">
                        <img src={Avatar2} className="w-14" alt="#" />
                      </div>
                      <div className="ml-8">
                        <h4 className="text-lg">{user?.fullName}</h4>
                        <p className="text-sm font-light">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center textlg font-semibold mt-24">
                  No Conversations
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="w-1/2 bg-yellow-50 h-screen flex flex-col">
          {chatData?.user?.fullName !== "Receiver" ? (
            <>
              <div className="w-full bg-green-500 flex flex-row text-left items-center rounded-b-lg justify-between p-3">
                <div className="flex flex-row border border-white bg-white rounded-full w-16 p-1 mx-5">
                  <img src={Avatar} className="w-14 cursor-pointer" alt="#" />
                  <div className="flex flex-col mx-6">
                    <h1 className="text-white font-semibold text-xl">
                      {chatData?.user?.fullName}
                    </h1>
                    <h1 className="text-white font-normal text-xs">
                      {chatData?.user?.email}
                    </h1>
                  </div>
                </div>
                <div className="w-14 p-1 mx-10 cursor-pointer">
                  <img src={Call8} className="w-14" alt="#" />
                </div>
              </div>
              <div className="w-full border border-b-gray-300 h-[80%] no-scrollbar overflow-y-scroll">
                <div className="p-7">
                  {messages.length > 0 ? (
                    messages.map(({ message, user: { id } }) => {
                      return (
                        <>
                        <div
                          className={`w-2/5 text-white rounded-b-xl p-2 mb-4 ${
                            id === user.id
                              ? "bg-blue-700 rounded-tl-xl ml-auto"
                              : "bg-lime-700 rounded-tr-xl"
                          }`}
                        >
                          {message}
                        </div>
                        <div ref={messageRef}></div>
                        </>
                      );
                    })
                  ) : (
                    <div className="text-center textlg font-semibold mt-24">
                      No Messages
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full flex flex-row">
                <Input
                  placeholder="Type a message..."
                  divClassName="w-[85%] m-0 ml-2 "
                  className="border-gray-300 rounded-3xl w-full -mt-1 shadow-md outline-none"
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                />
                <div className="rounded-full border h-10 m-3 flex items-center bg-emerald-500 ">
                  <img
                    src={Send}
                    className={`w-10 cursor-pointer ${
                      typedMessage === "" ? "hidden" : ""
                    }`}
                    alt="#"
                    onClick={sendMessage}
                  />
                </div>
                <div className="rounded-full border h-11 m-3 mt-[10px] ml-1 flex items-center bg-emerald-500 ">
                  <img src={Add1} className="h-11 cursor-pointer" alt="#" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-center font-normal text-lg my-auto">
                Please select a chat
                <br />
                to start chatting
              </div>
            </>
          )}
        </div>
        <div className="w-1/4 bg-emerald-50">
          <div className="font-semibold bg-white text-blue-800 pt-2">
            <div className="flex flex-row justify-between">
              <h1> </h1>
              <h1 className="text-center text-2xl my-2">Users</h1>
              <h1
                className="text-center text-lg rounded-md p-2 my-2 bg-red-600 text-white cursor-pointer mr-2"
                onClick={() => {
                  localStorage.removeItem("user:token");
                  navigate("/users/sign_in");
                }}
              >
                Sign Out
              </h1>
            </div>
            <hr />
          </div>
          <div>
            {users.length > 0 ? (
              users.map(({ user, userId }) => (
                <div>{globalUser.id !== userId && <div className="flex items-center mx-14 py-3 border-b border-b-gray-300 overflow-y-scroll">
                  <div
                    className={`cursor-pointer flex items-center`}
                    onClick={() =>
                      createConversation({ newUser: user, userId: userId })
                    }
                  >
                    <div className="border border-purple-500 rounded-full p-1">
                      <img src={Avatar} className={`w-14`} alt="#" />
                    </div>
                    <div className="ml-8">
                      <h4 className="text-lg">{user?.fullName}</h4>
                      <p className="text-sm font-light">{user?.email}</p>
                    </div>
                  </div>
                </div>}</div>
              ))
            ) : (
              <div className="text-center textlg font-semibold mt-24">
                No Users
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

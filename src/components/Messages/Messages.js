import React from "react";
import { connect } from "react-redux";
import { setUserPosts } from "../../actions";
import { Segment, Comment } from "semantic-ui-react";
import firebase from "../../firebase";
import MessagesHeader from "./MessagesHeader";
import MessagesForm from "./MessagesForm";
import Message from "./Message";
import Typing from "./Typing";
import Skeleton from "./Skeleton";
class Messages extends React.Component {
  state = {
    messagesRef: firebase.database().ref("messages"),
    typingRef: firebase.database().ref("typing"),
    channel: this.props.currentChannel,
    user: this.props.currentUser,
    messages: [],
    messagesLoading: true,
    numUniqueUsers: "",
    searchTerm: "",
    searchLoading: false,
    searchResults: [],
    privateChannel: this.props.isPrivateChannel,
    privateMessagesRef: firebase.database().ref("PrivateMessages"),
    isChannelStarred: false,
    usersRef: firebase.database().ref("users"),
    typingUsers: [],
    connectedRef: firebase.database().ref(".info/connected"),
    listeners: []
  };
  componentDidMount() {
    const { channel, user,listeners } = this.state;
    if (channel && user) {
      this.removeListeners(listeners)
      this.addListeners(channel.id);
      this.addUserStartsListener(channel.id, user.uid);
    }
  }
  componentWillUnmount() {
    this.removeListeners(this.state.listeners);
    this.state.connectedRef.off()
  }

  removeListeners=(listeners)=>{
    listeners.forEach(listener=>{
      listener.ref.child(listener.id).of(listener.event)
    })

  }

  addToListeners = (id, ref, e) => {
    const index = this.state.listeners.findIndex(listener => {
      return listener.id === id && listener.ref === ref && listener.e === e;
    });
    if (index !== -1) {
      const newListener = { id, ref, e };
      this.setState({
        listeners: this.state.listeners.concat(newListener)
      });
    }
  };

  addListeners = channelId => {
    this.addMessageListener(channelId);
    this.addTypingListeners(channelId);
  };

  addTypingListeners = channelId => {
    let typingUsers = [];
    this.state.typingRef.child(channelId).on("child_added", snap => {
      if (snap.key !== this.state.user.uid) {
        typingUsers = typingUsers.concat({
          id: snap.key,
          name: snap.val()
        });
        this.setState({
          typingUsers
        });
      }
    });

    this.addToListeners(channelId,this.state.typingRef,'chiled_added')
    this.state.typingRef.child(channelId).on("child_removed", snap => {
      const index = typingUsers.findIndex(user => user.id === snap.key);
      if (index !== -1) {
        typingUsers = typingUsers.filter(user => user.id !== snap.key);
        this.setState({ typingUsers });
      }
    });

    this.addToListeners(channelId,this.state.typingRef,'chiled_removed')
    this.state.connectedRef.on("value", snap => {
      if (snap.val() === true) {
        this.state.typingRef
          .child(channelId)
          .child(this.state.user.uid)
          .onDisconnect()
          .remove(err => {
            if (err !== null) {
              console.error(err);
            }
          });
      }
    });
  };
  addUserStartsListener = (channelId, userId) => {
    this.state.usersRef
      .child(userId)
      .child("starred")
      .once("value")
      .then(data => {
        if (data.val() !== null) {
          const channelIds = Object.keys(data.val());
          const prevStarred = channelIds.includes(channelId);

          this.setState({
            isChannelStarred: prevStarred
          });
        }
      });
  };
  addMessageListener = channelId => {
    let loadedMessages = [];
    const ref = this.getMessageRef();
    ref.child(channelId).on("child_added", snap => {
      loadedMessages.push(snap.val());
      this.setState({
        messages: loadedMessages,
        messagesLoading: false
      });
      this.CountUniqueUsers(loadedMessages);
      this.CountUsersPosts(loadedMessages);
    });
    this.addToListeners(channelId,ref,'chiled_added')
  };

  CountUniqueUsers = messages => {
    const uniqueUsers = messages.reduce((acc, message) => {
      if (!acc.includes(message.user.name)) {
        acc.push(message.user.name);
      }
      return acc;
    }, []);
    const numUniqueUsers =
      uniqueUsers.length <= 1
        ? `${uniqueUsers.length} user`
        : `${uniqueUsers.length} users`;
    this.setState({
      numUniqueUsers
    });
  };

  CountUsersPosts = messages => {
    let userPosts = messages.reduce((acc, message) => {
      if (message.user.name in acc) {
        acc[message.user.name].count += 1;
      } else {
        acc[message.user.name] = {
          avatar: message.user.avatar,
          count: 1
        };
      }
      return acc;
    }, {});
    // console.log(userPosts)
    this.props.setUserPosts(userPosts);
  };

  displayMessages = messages => (
    
      messages.length > 0 &&
      messages.map(message => (
        <Message
          key={message.timestamp}
          message={message}
          user={this.state.user}
        />
      )))
    
  // displayChannelName = channel => (channel ? `#${channel.name}` : "");

  handleSearchChange = e => {
    this.setState(
      {
        searchTerm: e.target.value,
        searchLoading: true
      },
      () => {
        this.handleSearchMessages();
      }
    );
  };
  getMessageRef = () => {
    const { messagesRef, privateMessagesRef, privateChannel } = this.state;
    return privateChannel ? privateMessagesRef : messagesRef;
  };

  handleSearchMessages = () => {
    const channelMessages = [...this.state.messages];
    const rgex = new RegExp(this.state.searchTerm, "gi");
    const searchResults = channelMessages.reduce((acc, message) => {
      if (
        (message.content && message.content.match(rgex)) ||
        message.user.name.match(rgex)
      ) {
        acc.push(message);
      }
      return acc;
    }, []);
    this.setState({
      searchResults
    });
    setTimeout(() => {
      this.setState({ searchLoading: false });
    }, 1000);
  };

  displayChannelName = channel => {
    return channel
      ? `${this.state.privateChannel ? "@" : "#"}${channel.name}`
      : "";
  };

  handleStar = () => {
    this.setState(
      prevState => ({
        isChannelStarred: !prevState.isChannelStarred
      }),
      () => this.starChannel()
    );
  };
  starChannel = () => {
    if (this.state.isChannelStarred) {
      this.state.usersRef.child(`${this.state.user.uid}/starred`).update({
        [this.state.channel.id]: {
          name: this.state.channel.name,
          details: this.state.channel.details,
          createdBy: {
            name: this.state.channel.createdBy.name,
            avatar: this.state.channel.createdBy.avatar
          }
        }
      });
    } else {
      this.state.usersRef
        .child(`${this.state.user.uid}/starred`)
        .child(this.state.channel.id)
        .remove(err => {
          if (err !== null) {
            console.error(err);
          }
        });
    }
  };

  displayTypingUsers = users => {
    return (
      users.length > 0 &&
      users.map(user => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "0.2em"
          }}
          key={user.id}
        >
          <span className='user__typing'>{user.name} is Typing</span> <Typing />
        </div>
      ))
    );
  };

  displayMessageSkeleton = loading =>
    loading ? (
      <React.Fragment>
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} />
        ))}
      </React.Fragment>
    ) : null;
  render() {
    const {
      messagesRef,
      channel,
      messages,
      numUniqueUsers,
      searchTerm,
      searchResults,
      searchLoading,
      privateChannel,
      isChannelStarred,
      typingUsers,
      messagesLoading
    } = this.state;
    return (
      <>
        <MessagesHeader
          channelName={this.displayChannelName(channel)}
          numUniqueUsers={numUniqueUsers}
          handleSearchChange={this.handleSearchChange}
          searchLoading={searchLoading}
          isPrivateChannel={privateChannel}
          handleStar={this.handleStar}
          isChannelStarred={isChannelStarred}
        />

        <Segment>
          <Comment.Group className='messages'>
            {this.displayMessageSkeleton(messagesLoading)}
            {searchTerm
              ? this.displayMessages(searchResults)
              : this.displayMessages(messages)}
            {this.displayTypingUsers(typingUsers)}
          </Comment.Group>
        </Segment>
        <MessagesForm
          messagesRef={messagesRef}
          currentChannel={channel}
          currentUser={this.state.user}
          isPrivateChannel={privateChannel}
          getMessageRef={this.getMessageRef}
        />
      </>
    );
  }
}

export default connect(null, { setUserPosts })(Messages);

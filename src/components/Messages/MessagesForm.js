import React, { Component } from "react";
import { Segment, Button, Input } from "semantic-ui-react";
import {v4 as uuidv4} from "uuid";
import {Picker,emojiIndex} from 'emoji-mart'
import 'emoji-mart/css/emoji-mart.css'
import firebase from "../../firebase";
import FielModal from "./FielModal";
class MessagesForm extends Component {
  state = {
    uploadTask: null,
    uploadState: "",
    storageRef: firebase.storage().ref(),
    message: "",
    loading: false,
    channel: this.props.currentChannel,
    user: this.props.currentUser,
    errors: [],
    maodal: false,
    percentUploaded: 0,
    typingRef: firebase.database().ref("typing"),
    emojiPicker:false,
    
  };


  componentWillUnmount(){
    if(this.state.uploadTask!==null){
      this.state.uploadTask.cancel()
      this.setState({uploadTask:null})
    }
  }
  openmodal = () => {
    this.setState({
      modal: true
    });
  };
  handleChange = e => {
    this.setState({
      [e.target.name]: e.target.value
    });
  };

  handleKeyDown = (e) => {
    if(e.ctrlKey && e.keyCode===13){
      console.log(e.keyCode)
    }
    const { message, typingRef, channel, user } = this.state;
    if (message) {
      typingRef
        .child(channel.id)
        .child(user.uid)
        .set(user.displayName);
    } else {
      typingRef
        .child(channel.id)
        .child(user.uid)
        .remove()
    }
  };
  createMessage = (fileUrl = null) => {
    const message = {
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      user: {
        id: this.state.user.uid,
        name: this.state.user.displayName,
        avatar: this.state.user.photoURL
      }
    };
    if (fileUrl !== null) {
      message["image"] = fileUrl;
    } else {
      message["content"] = this.state.message;
    }
    return message;
  };
  sendMessage = () => {
    const { getMessageRef } = this.props;
    const { message, channel,typingRef,user } = this.state;
    if (message) {
      this.setState({
        loading: true
      });
      getMessageRef()
        .child(channel.id)
        .push()
        .set(this.createMessage())
        .then(() => {
          this.setState({
            loading: false,
            message: "",
            errors: []
          });
          typingRef
          .child(channel.id)
          .child(user.uid)
          .remove()
        })
        .catch(err => {
          console.error(err);
          this.setState({
            loading: false,
            errors: [...this.state.errors, err]
          });
        });
    } else {
      this.setState({
        errors: this.state.errors.concat({ message: "Add a message" })
      });
    }
  };

  closeModal = () => {
    this.setState({
      modal: false
    });
  };

  getPath = () => {
    if (this.props.isPrivateChannel) {
      return `chat/private/${this.state.channel.id}`;
    } else {
      return `chat/public`;
    }
  };

  uploadFile = (file, metadata) => {
    const pathToUpload = this.state.channel.id;
    const ref = this.props.getMessageRef;
    // const filePath = `chat/public/${uuid()}.jpg`;
    const filePath = `${this.getPath()}/${uuidv4()}.jpg`;
    this.setState(
      {
        uploadState: "uploading",
        uploadTask: this.state.storageRef.child(filePath).put(file, metadata)
      },
      () => {
        this.state.uploadTask.on("state_changed", snap => {
          const percentUploaded =
            Math.round(snap.bytesTransferred / snap.totalBytes) * 100;
          this.setState(
            {
              percentUploaded
            },
            err => {
              console.error(err)
              this.setState({
                errors: this.state.errors.concat(err),
                uploadState: "error",
                uploadTask: null
              });
            },
            () => {
              this.state.uploadTask.snapshot.ref
                .getDownloadURL()
                .then(downloadUrl => {
                  this.sendFileMessage(downloadUrl,ref,pathToUpload);
                })
                .catch(err => {
                  console.log(err);
                  this.setState({
                    errors: this.state.errors.concat(err),
                    uploadState: "error",
                    uploadTask: null
                  });
                });
            }
          );
        });
      }
    );
  };

  sendFileMessage = (fileUrl, ref, pathToUpload) => {
    ref
      .child(pathToUpload)
      .push()
      .set(this.createMessage(fileUrl))
      .then(() => {
        this.setState({
          uploadState: "done"
        });
      })
      .catch(err => {
        console.error(err);
        this.setState({
          errors: this.state.errors.concat(err)
        });
      });
  };

  handleTogglePicker=()=>{
    this.setState({
      emojiPicker:!this.state.emojiPicker
    })
  }

  addEmoji=(emoji)=>{
    const oldMessage=this.state.message
    const newMessage=this.colonToUnicode(`${oldMessage} ${emoji.colons}`)
    this.setState({
      message:newMessage,
      emojiPicker:false
    })
    setTimeout(() => {
      this.messageInputRef.focus()
    }, 0);
  }

  colonToUnicode=message=>{
    return message.replace(/:[A-Za-z0-9_+-]+:/g,x=>{
      x=x.replace(/:/g,"")
      let emoji=emojiIndex.emojis[x]
      if(typeof emoji!=="undefined"){
        let unicode =emoji.native
        if(typeof unicode !== "undefined"){
          return unicode
        }
      }
      x=":" + x + ":"
      return x
    })
  }
  render() {
    const { loading, message, modal,emojiPicker } = this.state;
    return (
      <Segment className='message__form'>
        {emojiPicker && (
          <Picker 
          set='apple'
          className='emojipicker'
          title='Pick your Emoji'
          emoji='point_up'
          onSelect={this.addEmoji}
          />
        )}
        <Input
          value={message}
          fluid
          name='message'
          em
          label={<Button icon={emojiPicker ?"close" :"add"} 
          onClick={this.handleTogglePicker}
          content={emojiPicker ? 'close':null}
          />}
          labelPosition='left'
          placeholder='write your Message'
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          className={this.state.errors.length > 0 ? "error" : ""}
          ref={node =>(this.messageInputRef=node)}
        />
        <Button.Group icon widths='2' style={{ marginTop: "3em" }}>
          <Button
            onClick={this.sendMessage}
            color='orange'
            content='Add Reply'
            labelPosition='left'
            icon='edit'
            disabled={loading}
          />
          <Button
            color='teal'
            content='Upload Media'
            labelPosition='right'
            icon='cloud upload'
            onClick={this.openmodal}
          />
          <FielModal
            modal={modal}
            closeModal={this.closeModal}
            uploadFile={this.uploadFile}
          />
        </Button.Group>
      </Segment>
    );
  }
}

export default MessagesForm;

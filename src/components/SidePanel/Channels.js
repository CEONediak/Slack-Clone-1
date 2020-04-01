import React, { Component } from "react";
import {
  Menu,
  Icon,
  Modal,
  Form,
  Input,
  Button,
  Label
} from "semantic-ui-react";
import { connect } from "react-redux";
import { setCurrentChannel, setPrivateChannel } from "../../actions/index";
import firebase from "../../firebase";
class Channels extends Component {
  state = {
    user: this.props.currentUser,
    channels: [],
    modal: false,
    channelName: "",
    channelDetails: "",
    channelsRef: firebase.database().ref("channels"),
    firstLoad: true,
    activeChannel: "",
    channel: null,
    messageRef: firebase.database().ref("messages"),
    notifications: [],
    typingRef: firebase.database().ref("typing"),
    users: firebase.database().ref("users")
  };
  componentDidMount() {
    this.addListeners();
  }

  componentWillUnmount() {
    this.removeListener();
  }

  addNotificationListener = channelId => {
    this.state.messageRef.child(channelId).on("value", snap => {
      if (this.state.channel) {
        this.handleNotification(
          channelId,
          this.state.channel.id,
          this.state.notifications,
          snap
        );
      }
    });
  };

  handleNotification = (channelId, currentChannelID, notifications, snap) => {
    let lastTotal = 0;
    let index = notifications.findIndex(
      notification => notification.id === channelId
    );
    if (index !== -1) {
      if (channelId !== currentChannelID) {
        lastTotal = notifications[index].total;

        if (snap.numChildren() - lastTotal > 0) {
          notifications[index].count = snap.numChildren() - lastTotal;
        }
      }
      notifications[index].lastKnownTotl = snap.numChildren();
    } else {
      notifications.push({
        id: channelId,
        total: snap.numChildren(),
        lastKnownTotl: snap.numChildren(),
        count: 0
      });
    }
    this.setState({
      notifications
    });
  };

  addListeners = () => {
    let loadedChannels = [];
    this.state.channelsRef.on("child_added", snap => {
      loadedChannels.push(snap.val());
      this.setState(
        {
          channels: loadedChannels
        },
        () => {
          this.setFirstChannel();
        }
      );
      this.addNotificationListener(snap.key);
    });
  };
  removeListener = () => {
    this.state.channelsRef.off();
    // this.state.channelsRef.forEach(channel=>{
    //   this.state.messageRef.child(channel.id).off()
    // })
  };

  setFirstChannel = () => {
    const firstChannel = this.state.channels[0];
    if (this.state.firstLoad && this.state.channels.length > 0) {
      this.props.setCurrentChannel(firstChannel);
      this.setActiveChannel(firstChannel);
      this.setState({
        channel: firstChannel
      });
    }
    this.setState({ firstLoad: false });
  };
  addChannel = () => {
    const { channelsRef, channelName, channelDetails, user } = this.state;
    const key = channelsRef.push().key;
    const newChannel = {
      id: key,
      name: channelName,
      details: channelDetails,
      createdBy: {
        name: user.displayName,
        avatar: user.photoURL
      }
    };
    channelsRef
      .child(key)
      .update(newChannel)
      .then(() => {
        this.setState({
          channelName: "",
          channelDetails: ""
        });
        this.closeModel();
        console.log("channel added");
      })
      .catch(err => {
        console.log(err);
      });
  };

  handleSubmlit = e => {
    e.preventDefault();
    if (this.isFormValid(this.state)) {
      this.addChannel();
    }
  };

  isFormValid = ({ channelName, channelDetails }) =>
    channelDetails && channelName;
  closeModel = () => {
    this.setState({ modal: false });
  };
  handleChange = e => {
    this.setState({
      [e.target.name]: e.target.value
    });
  };
  openModel = () => {
    this.setState({
      modal: true
    });
  };

  displayChannels = channels =>
    channels.length > 0 &&
    channels.map(channel => (
      <Menu.Item
        key={channel.id}
        onClick={() => this.channgeChannel(channel)}
        name={channel.name}
        style={{ opacity: 0.7 }}
        active={channel.id === this.state.activeChannel}
      >
        {this.getNotificationCount(channel) && (
          <Label color='red'>{this.getNotificationCount(channel)}</Label>
        )}
        #{channel.name}
      </Menu.Item>
    ));

  getNotificationCount = channel => {
    let count = 0;
    this.state.notifications.forEach(notification => {
      if (notification.id === channel.id) {
        count = notification.count;
      }
    });
    if (count > 0) return count;
  };

  channgeChannel = channel => {
    this.setActiveChannel(channel);
    this.state.typingRef
      .child(this.state.channel.id)
      .child(this.state.user.uid)
      .remove();
    this.clearNotification();
    this.props.setCurrentChannel(channel);
    this.props.setPrivateChannel(false);
    this.setState({
      channel
    });
  };
  clearNotification = () => {
    let index = this.state.notifications.findIndex(
      notification => notification.id === this.state.channel.id
    );
    if (index !== -1) {
      let updateNotifications = [...this.state.notifications];
      updateNotifications[index].total = this.state.notifications[
        index
      ].lastKnownTotl;
      updateNotifications[index].count = 0;
      this.setState({
        notifications: updateNotifications
      });
    }
  };
  setActiveChannel = channel => {
    this.setState({
      activeChannel: channel.id
    });
  };
  render() {
    const { channels, modal } = this.state;

    return (
      <>
        <Menu.Menu className='menu'>
          <Menu.Item>
            <span>
              <Icon name='exchange' /> Channels
            </span>{" "}
            {channels.length}
            <Icon name='add' onClick={this.openModel} />
          </Menu.Item>
          {this.displayChannels(channels)}
        </Menu.Menu>
        {/* //Add Chanel Model */}
        <Modal basic open={modal} onClose={this.closeModel}>
          <Modal.Header>Add a Channel</Modal.Header>
          <Modal.Content>
            <Form onSubmit={this.handleSubmlit}>
              <Form.Field>
                <Input
                  fluid
                  label='Name of Channel'
                  name='channelName'
                  onChange={this.handleChange}
                  value={this.state.channelName}
                />
              </Form.Field>
              <Form.Field>
                <Input
                  fluid
                  label='Detils of Channel'
                  name='channelDetails'
                  onChange={this.handleChange}
                  value={this.state.channelDetails}
                />
              </Form.Field>
            </Form>
          </Modal.Content>
          <Modal.Actions>
            <Button color='green' inverted onClick={this.handleSubmlit}>
              <Icon name='checkmark' /> Add
            </Button>
            <Button color='red' inverted onClick={this.closeModel}>
              <Icon name='remove' /> Cancel
            </Button>
          </Modal.Actions>
        </Modal>
      </>
    );
  }
}

export default connect(null, { setCurrentChannel, setPrivateChannel })(
  Channels
);

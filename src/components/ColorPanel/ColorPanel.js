import React from "react";
import {connect} from 'react-redux'
import {setColors} from '../../actions'
import firebase from "../../firebase";
import {
  Sidebar,
  Menu,
  Divider,
  Button,
  Modal,
  Icon,
  Label,
  Segment
} from "semantic-ui-react";
import { SliderPicker } from "react-color";
class ColorPanel extends React.Component {
  state = {
    userColors: "",
    modal: false,
    primary: "",
    secondary: "",
    usersRef: firebase.database().ref("users"),
    user: this.props.currentUser
  };

  componentDidMount() {
    if (this.state.user) {
      this.addListener(this.state.user.uid);
    }
  }

  componentWillUnmount(){
    this.removeListener()
  }

  removeListener=()=>{
    this.state.usersRef.child(`${this.state.user.uid}/colors`)
      .off()
  }

  addListener = userId => {
    let userColors = [];
    this.state.usersRef.child(`${userId}/colors`).on("child_added", snap => {
      userColors.unshift(snap.val());
      this.setState({ userColors });
    });
  };

  openModal = () => {
    this.setState({
      modal: true
    });
  };
  closeModal = () => {
    this.setState({
      modal: false
    });
  };

  handleChangePrimary = color => this.setState({ primary: color.hex });
  handleChangeSecendary = color => this.setState({ secondary: color.hex });

  handleSave = () => {
    if (this.state.primary && this.state.secondary) {
      this.saveColors(this.state.primary, this.state.secondary);
    }
  };

  saveColors = (primary, secondary) => {
    this.state.usersRef
      .child(`${this.state.user.uid}/colors`)
      .push()
      .update({
        primary,
        secondary
      })
      .then(() => {
        console.log("color add");
        this.closeModal();
      })
      .catch(err => console.error(err));
  };

  displayUserColors = colors => {
   return colors.length > 0 &&
      colors.map((color, i) => {
        return (
          <React.Fragment key={i}>
            <Divider />
            <div className='color__container' onClick={()=>this.props.setColors(color.primary,color.secondary)}>
              <div
                className='color__square'
                style={{ background: color.primary }}
              >
                <div
                  className='color__overlay'
                  style={{ background: color.secondary }}
                ></div>
              </div>
            </div>
          </React.Fragment>
        );
      });
  };

  render() {
    const { modal, primary, secondary, userColors } = this.state;
    return (
      <Sidebar
        as={Menu}
        icon='labeled'
        inverted
        vertical
        visible
        width='very thin'
      >
        <Divider />
        <Button icon='add' size='small' color='blue' onClick={this.openModal} />
        {this.displayUserColors(userColors)}
        {/* Color Picker Model */}

        <Modal basic open={modal} onClose={this.onClose}>
          <Modal.Header>Choose App Color</Modal.Header>
          <Modal.Content>
            <Segment inverted>
              <Label content='Primary Color' />
              <SliderPicker
                color={primary}
                onChange={this.handleChangePrimary}
              />
            </Segment>
            <Segment inverted>
              <Label content='Secondary Color' />
              <SliderPicker
                color={secondary}
                onChange={this.handleChangeSecendary}
              />
            </Segment>
          </Modal.Content>
          <Modal.Actions>
            <Button color='green' inverted onClick={this.handleSave}>
              <Icon name='checkmark' />
              Save Colors
            </Button>
            <Button color='red' inverted onClick={this.closeModal}>
              <Icon name='remove' />
              Cancel
            </Button>
          </Modal.Actions>
        </Modal>
      </Sidebar>
    );
  }
}

export default connect(null,{setColors})(ColorPanel);

import React from "react";
import {
  Grid,
  Header,
  Icon,
  Input,
  Dropdown,
  Image,
  Modal,
  Button
} from "semantic-ui-react";
import AvatarEditor from "react-avatar-editor";
import firebase from "../../firebase";
class UserPanel extends React.Component {
  state = {
    user: this.props.currentUser,
    modal: false,
    previewImage: "",
    croppedImage:'',
    blob:'',
    storageRef:firebase.storage().ref(),
    userRef:firebase.auth().currentUser,
    usersRef:firebase.database().ref('users'),
    metadata:{
      contentType:'image/jpeg'
    },
    uploadedCroppedImage:''
  }
  openModal = () => this.setState({ modal: true });
  closeModal = () => this.setState({ modal: false });

  dropdownOptions = () => [
    {
      key: "user",
      text: (
        <span>
          Signed in as <strong>{this.state.user.displayName}</strong>
        </span>
      ),
      disabled: true
    },
    {
      key: "avatar",
      text: <span onClick={this.openModal}>Change Avatar</span>
    },
    {
      key: "signedout",
      text: <span onClick={this.handleSignout}>Signed Out</span>
    }
  ];

  handleChange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    if (file) {
      reader.readAsDataURL(file);
      reader.addEventListener("load", () => {
        this.setState({
          previewImage: reader.result
        });
      });
    }
  };

  uploadCroppedImage=()=>{
const {storageRef,userRef,blob,metadata}=this.state
    storageRef.child(`avatar/users/${userRef.uid}`)
    .put(blob,metadata)
    .then(snap=>{
      snap.ref.getDownloadURL().then(downloadeUrl=>{
        this.setState({
          uploadedCroppedImage:downloadeUrl
        },()=>{
          this.changeAvatar()
        })
      })
    })
  }

  changeAvatar=()=>{
    this.state.userRef
    .updateProfile({
      photoURL:this.state.uploadedCroppedImage
    },()=>{
      console.log('phot updataed')
      this.closeModal()
    }).catch(err=>console.log('erro'))
    
    this.state.usersRef.child(this.state.user.uid)
      .update({avatar:this.state.uploadedCroppedImage})
      .then(()=>{
        console.log('user avatar updated')
      })
      .catch(err=>console.log('error'))
  }
  handleCropImage=()=>{
if(this.avatarEditor){
  this.avatarEditor.getImageScaledToCanvas().toBlob(blob=>{
    let imageUrl=URL.createObjectURL(blob)
    this.setState({
      croppedImage:imageUrl,
      blob
    })
  })
}
  }
  handleSignout = () => {
    firebase
      .auth()
      .signOut()
      .then(() => console.log("signed out"));
  };
  render() {
    const { user, modal, previewImage,blob,croppedImage } = this.state;
    const { primaryColor } = this.props;

    return (
      <Grid style={{ backgound: primaryColor }}>
        <Grid.Column>
          <Grid.Row style={{ padding: "1.2em", margin: 0 }}>
            {/* App Header */}
            <Header inverted floated='left' as='h2'>
              <Icon name='code' />
              <Header.Content>DevChat</Header.Content>
            </Header>
          </Grid.Row>

          {/* User DropDown */}
          <Grid.Row>
            <Header style={{ padding: "0.25em" }} as='h4' inverted>
              <Dropdown
                trigger={
                  <span>
                    <Image src={user.photoURL} spaced='right' avatar />
                    {user.displayName}
                  </span>
                }
                options={this.dropdownOptions()}
              />
            </Header>
          </Grid.Row>
          <Modal basic open={modal} onClose={this.closeModal}>
            <Modal.Header>Change Avatar</Modal.Header>
            <Modal.Content>
              <Input
                onChange={this.handleChange}
                fluid
                type='file'
                label='New Avatar'
                name='previewImage'
              />
              <Grid centered stackable columns={2}>
                <Grid.Row centered>
                  <Grid.Column className='ui center aligned grid'>
                    {previewImage && (
                      <AvatarEditor 
                      image={previewImage}
                      width={120}
                      height={120}
                      border={50}
                      scale={1.2}
                      ref={node=>(this.avatarEditor=node)}
                      />
                    )}
                  </Grid.Column>
                  <Grid.Column>
                    {croppedImage && (
                      <Image
                      style={{margin:'3.5em auto'}}
                      height={100} 
                      width={100}
                      src={croppedImage}
                      />
                    )}
                  </Grid.Column>
                </Grid.Row>
              </Grid>
            </Modal.Content>
            <Modal.Actions>
             {croppedImage && <Button color='green' inverted onClick={this.uploadCroppedImage}>
                <Icon name='save' /> Change Avatar
              </Button>}
              <Button color='green' inverted onClick={this.handleCropImage}>
                <Icon name='image' /> Preview
              </Button>
              <Button color='red' inverted onClick={this.closeModal}>
                <Icon name='reove' /> Close
              </Button>
            </Modal.Actions>
          </Modal>
        </Grid.Column>
      </Grid>
    );
  }
}

export default UserPanel;

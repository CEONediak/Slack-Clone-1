import React, { Component } from "react";
import {
  Grid,
  Form,
  Segment,
  Button,
  Header,
  Message,
  Icon
} from "semantic-ui-react";
import md5 from 'md5'
import firebase from "../../firebase";
import { Link } from "react-router-dom";
class Register extends Component {
  state = {
    email: "",
    password: "",
    passwordConfirmation: "",
    username: "",
    errors:[],
    loading:false,
    usersRef:firebase.database().ref('users')
  };
  handleChange = e => {
    this.setState({
      [e.target.name]: e.target.value
    });
  };

  isFormEmpty = ({ email, password, passwordConfirmation, username }) => {
    return (
      !username.length ||
      !email.length ||
      !password.length ||
      !passwordConfirmation.length
    );
  };
  isPasswordValid=({password,passwordConfirmation})=>{
      if(password.length <6 || passwordConfirmation.length<6){
          return false
      }else if(password!==passwordConfirmation){
        return false
      }
      else {
          return true
      }
  }

  isFormValid = () => {
      let errors=[]
      let error
    if (this.isFormEmpty(this.state)) {
        error={message:'Fill in all Fields'}
        this.setState({errors:errors.concat(error)})
        return false
    } else if (!this.isPasswordValid(this.state)) {
        error={message:'Password dosent Match'}
        this.setState({errors:errors.concat(error)})
        return false
    } else {
      return true;
    }
  };

  handleSubmit = e => {
      const {email}=this.state
    e.preventDefault();
    if (this.isFormValid()) {
        this.setState({errors:[],loading:true})
      firebase
        .auth()
        .createUserWithEmailAndPassword(this.state.email, this.state.password)
        .then(createdUser => { 
            createdUser.user.updateProfile({
                displayName:this.state.username,
                photoURL:`http://gravatar.com/avatar/${md5(createdUser.user,email)}?d=identicon`
            })
            .then(()=>{
            this.saveUser(createdUser).then(()=>{
                console.log('user saved')
            })
        })
        })
        
        .catch(err => {
        //   console.err(err);
        
          this.setState({loading:false,errors:[...this.state.errors,err]})
        });
    }
  };

  saveUser=(createdUser)=>{
      return this.state.usersRef.child(createdUser.user.uid).set({
          name:createdUser.user.displayName,
          avatar:createdUser.user.photoURL
      })
  }
handleInoutError=(errors,inputName)=>{
    return errors.some(error=>error.message.toLowerCase().includes(inputName))
    ?'error':""

}
  dispalyError=errors=>errors.map(error=>(
      <p key={error.i}>{error.message}</p>
  ))
  render() {
    //   console.log(this.state.errors)
    const { username, email, password, passwordConfirmation,errors,loading } = this.state;
    return (
      <Grid textAlign='center' verticalAlign='middle' className='app'>
        <Grid.Column style={{ maxWidth: 450 }}>
          <Header as='h2' color='orange' textAlign='center'>
            <Icon name='puzzle piece' col='orange' />
            Register for DevChat
          </Header>
          <Form size='large' onSubmit={this.handleSubmit}>
            <Segment stacked>
              <Form.Input
                fluid
                name='username'
                icon='user'
                iconPosition='left'
                placeholder='Username'
                onChange={this.handleChange}
                type='text'
                value={username}
                className={this.handleInoutError(errors,username)}
              />
              <Form.Input
                fluid
                name='email'
                icon='mail'
                iconPosition='left'
                placeholder='Email Adress'
                onChange={this.handleChange}
                type='email'
                value={email}
                className={this.handleInoutError(errors,email)}
              />
              <Form.Input
                fluid
                name='password'
                icon='lock'
                iconPosition='left'
                placeholder='Password'
                onChange={this.handleChange}
                type='password'
                value={password}
                className={this.handleInoutError(errors,password)}
              />
              <Form.Input
                fluid
                name='passwordConfirmation'
                icon='repeat'
                iconPosition='left'
                placeholder='Password Confirmation'
                onChange={this.handleChange}
                type='password'
                value={passwordConfirmation}
                className={this.handleInoutError(errors,passwordConfirmation)}
              />
              <Button disabled={loading} className={loading ?'loading':''} color='orange' fluid size='large'>
                Submit
              </Button>
              <Message>
                Already a User ? <Link to='/login'>Login</Link>
              </Message>
            </Segment>
          </Form>
          {
             errors.length >0 && (
                <Message error>
                <h3>Error</h3>
                {this.dispalyError(errors)}
            </Message>
              )
          }
        </Grid.Column>
      </Grid>
    );
  }
}

export default Register;

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
import firebase from "../../firebase";
import { Link } from "react-router-dom";
class Login extends Component {
  state = {
    email: "",
    password: "",
    errors:[],
    loading:false,
  };
  handleChange = e => {
    this.setState({
      [e.target.name]: e.target.value
    });
  };

  
  

  

  handleSubmit = e => {
      
    e.preventDefault();
    if (this.isFormValid(this.state)) {
        this.setState({errors:[],loading:true})
        firebase
        .auth()
        .signInWithEmailAndPassword(this.state.email,this.state.password)
        .then(signedUser=>{
            // console.log(signedUser)
        })
        .catch(err=>{
            // console.err(err)
            this.setState({
                errors:[...this.state.errors,err],
                loading:false
            })
        })
    }
  };

  isFormValid=({email,password})=> email && password
 
handleInoutError=(errors,inputName)=>{
    return errors.some(error=>error.message.toLowerCase().includes(inputName))
    ?'error':""

}
  dispalyError=errors=>errors.map(error=>(
      <p key={error.i}>{error.message}</p>
  ))
  render() {
    //   console.log(this.state.errors)
    const { email, password,errors,loading } = this.state;
    return (
      <Grid textAlign='center' verticalAlign='middle' className='app'>
        <Grid.Column style={{ maxWidth: 450 }}>
          <Header as='h2' color='violet' textAlign='center'>
            <Icon name='code branch' col='violet' />
            Login To DevChat
          </Header>
          <Form size='large' onSubmit={this.handleSubmit}>
            <Segment stacked>
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
              
              <Button disabled={loading} className={loading ?'loading':''} color='violet' fluid size='large'>
                Submit
              </Button>
              <Message>
               Don't have an account ? <Link to='/register'>Register</Link>
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

export default Login;

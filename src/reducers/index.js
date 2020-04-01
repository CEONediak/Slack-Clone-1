import {combineReducers} from 'redux'
import * as actionTypes from '../actions/types'
const initUser={
    currentUser:null,
    isLoading:true
}

const user_reducer=(state=initUser,action)=>{
    switch(action.type){
        case actionTypes.SET_USER:
            return {
                currentUser:action.payload.currentUser,
                isLoading:false
            }
        case actionTypes.CLEAR_USER:
            return {
                ...initUser,
                isLoading:false
            }
         
            default:
                return state
    }
}

const initialChannel={
    currentChannel:null,
    isPrivateChannel:false,
    userPosts:null
}

const channel_action=(state=initialChannel,action)=>{
    switch(action.type){
        case actionTypes.SET_CURRENT_CHANNEL:
            return {
                ...state,
                currentChannel:action.payload.currentChannel
            }
        case actionTypes.SET_PRIVATE_CHANNEL:
            return {
                ...state,
                isPrivateChannel:action.payload.isPrivateChannel
            }
        case actionTypes.SET_USER_POST:
             return {
                    ...state,
                    userPosts:action.payload.userPosts
                }
            default:
                return state
    }
}

const initColors={
    primaryColor:'#4c3c4c',
    secondaryColor:'#eee'
}

const colors_reducer=(state=initColors,action)=>{
    switch(action.type){
        case actionTypes.SET_COLORS:
        return {
            primaryColor:action.payload.primaryColor,
            secondaryColor:action.payload.secondaryColor
        }

        default:
            return state
    }
}


const rootReducer=combineReducers({
    user:user_reducer,
    channel:channel_action,
    colors:colors_reducer
})

export default rootReducer

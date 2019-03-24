import React, { Component} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle} from '@fortawesome/free-solid-svg-icons'
import {faCircle } from '@fortawesome/free-regular-svg-icons'

class Button extends Component{
    constructor(props){
        super(props);
        this.state = {
            active: true
        }
    }

    render () {
        return (
            <button 
                className="action-btn" 
                style={ {color : this.props.color}}
                onClick={() => {
                    this.setState({active : !this.state.active})
                    
                    }
                }
            >
                {
                    this.state.active ? 
                        <FontAwesomeIcon icon={faCheckCircle} />
                    :   <FontAwesomeIcon icon={faCircle} />
                }          
                {this.props.value}
            </button>
        )
    }

}

export default Button;
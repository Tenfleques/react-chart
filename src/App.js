import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon} from '@fortawesome/free-solid-svg-icons'

import Chart from "./chart/Chart"
import './App.css';

class App extends Component {
  constructor (props) {
    super(props);
    this.state = {
      themes : ["App light", "App mojave"],
      current_theme: 0,
      width : 400
    }   
  }
  themeSwitcher (){
    return (            
        <FontAwesomeIcon icon={faMoon} className="theme-switcher fa-2x mx-3 mt-1" 
        onClick={() => {
            this.setState({
              current_theme : (this.state.current_theme === 0)? 1 : 0
            })
        }
      }/>
    )
  }
  render() {
    return (
      <div className={this.state.themes[this.state.current_theme]} >
        <div className="charcoal fixed-top row">
          <h1 className="mx-3">Statistics</h1>
          {this.themeSwitcher()}
        </div>
        <div className="mt-5">
          <div className="row my-3">
            <Chart chart={0}/>
          </div>
          <div className="row my-3"><Chart chart={1}/></div>
          <div className="row my-3"><Chart chart={2}/></div>
          <div className="row my-3"><Chart chart={3}/></div>
          <div className="row my-3"><Chart chart={4}/></div>
        </div>
        

      </div>
    );
  }
}

export default App;

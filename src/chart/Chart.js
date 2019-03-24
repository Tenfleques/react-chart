import React, {Component } from "react"
import Canvas from "./Canvas"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle} from '@fortawesome/free-solid-svg-icons'
import {faCircle } from '@fortawesome/free-regular-svg-icons'

import data from "./data/chart_data"

class Chart extends Component{
    constructor (props) {
        super(props);
        this.state = {
            data: data[props.chart],
            names: Object.keys(data[props.chart].names),
            active: {},
            x : [],
            y : {},
            width : document.body.offsetWidth - 350,
            grid_x : false,
            grid_y : true
        }
        for (var ky in this.state.names){
            this.state.active[this.state.names[ky]] = true;
        }
        this.state.x = this.state.data.columns.filter((arr) => {
            return arr[0] === 'x';
        })[0].slice(1);

        let y = {};
        for(var i = 0; i < this.state.data.columns.length; ++i){
            let k = this.state.data.columns[i][0]
            if(k === 'x')
                continue;            
            y[k] = this.state.data.columns[i].slice(1);
        }
        this.state.y = y; 
        this.canvasElement = React.createRef();       
    }
    updateDimensions = () => {
        const w = document.body.offsetWidth - 350;
        this.setState({
            width : w
        },()=>{
            this.canvasElement.current.plotLower(this.state.x, this.activeData(), w)
        });
    }
    componentWillMount() {
        this.updateDimensions();
    }
    componentDidMount() {
        window.addEventListener("resize", this.updateDimensions);
    }
    componentWillUnmount() {
        window.removeEventListener("resize", this.updateDimensions);
    }
    activeData = () => {       
        let active_columns = {};
        for(var ky in this.state.active){
            if(this.state.active[ky]){
                active_columns[ky] = this.state.y[ky];
            }
        }
        return active_columns;
    }
    buttonRow = () => {
        return Object.entries(this.state.data.names).map((k) => {
            return (

                <button 
                    key = {k[0]}
                    className="action-btn" 
                    style={ {color : this.state.data.colors[k[0]]}}
                    onClick={() => {
                            let active = this.state.active;
                            active[k[0]] = !active[k[0]];
                            this.setState({active})
                            this.canvasElement.current.plotLower(this.state.x, this.activeData(), this.state.width);
                        }
                    }
                >
                    {
                        this.state.active[k[0]] ? 
                            <FontAwesomeIcon icon={faCheckCircle} />
                        :   <FontAwesomeIcon icon={faCircle} />
                    }          
                    {k[1]} 
            </button>
            )
        });
    }
    settingsRow = () => {
        return (
            <div>
                 <button 
                    key = "toggle-y-grid"
                    className={(this.state.grid_y)? "toggle-grid active" : "toggle-grid"} 
                    onClick={() => {
                           this.setState({grid_y : !this.state.grid_y})
                           this.canvasElement.current.toggleYGrid();
                        }
                    }
                >
                toggle Y grid
                </button>
                <button 
                    key = "toggle-x-grid"
                    className={(this.state.grid_x)? "toggle-grid active" : "toggle-grid"} 
                    onClick={() => {
                           this.setState({grid_x : !this.state.grid_x})
                           this.canvasElement.current.toggleXGrid();
                        }
                    }
                >
                toggle X grid
                </button>
            </div>
        )
    }
    render() {
        return (
            <div className="mb-3 border-bottom">
                <h2>Chart {this.props.chart + 1}</h2>
                <div className="row mx-3">
                    {this.settingsRow()}
                </div>
                <Canvas 
                    ref={this.canvasElement} 
                    x={this.state.x} 
                    y={this.activeData()} 
                    colors={this.state.data.colors}
                    names={this.state.data.names} 
                    width={this.state.width}
                    />

                <div className="row mx-3">
                    {this.buttonRow()}
                </div>
            </div>
        )
    }
}
export default Chart;
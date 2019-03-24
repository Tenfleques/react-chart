import React, { Component} from 'react';
import dateFormat from "./DateFormat";

Date.prototype.format = function (mask, utc) {
	return dateFormat(this, mask, utc);
};

class Canvas extends Component{
    constructor(props){
        super(props);
        const w = Math.max(props.width,400);
        this.state = {
            height : 400,
            width : Math.max(w,600),
            lower_height: 80,
            grid : {
                y : true,
                x : false,
                strokeStyle : "rgba(0,0,0,.9)",
                lineWidth : .12
            },
            axes : {
                x : {
                    threshold : .3,
                    height : 50
                },
                y : {
                    threshold : .2,
                    width : 30
                },
                font : "15px Arial",
                font_color : "#999"
            },
            slider: {
                x : 400,
                y : 80,
                width: 50,
                height: -80,
                min_width: 10,
                lineWidth : 6,
                stroke: "#ddd",
                fill: "rgba(255,255,255,0.8)",
                drag: false,
                grow: {
                    right : false,
                    left : false 
                },
                x_at_mouse_down: 0,
                slide_factor: 1//0.8
            },
            y : props.y,
            x : props.x,
            scaled: {
            },
            info_box: -1
        }
        var max_y = 100;
        //get num_digits of max y, to calculate the width of y axis
        for(var zz in props.y){
            max_y = Math.max(max_y, Math.max(...props.y[zz]));
        }        
        this.state.axes.y.width = max_y.toString().length *10;
        
    }
    componentWillMount(){
        this.scaleData();
    }
    componentDidMount(){
        this.plotLower(this.state.x, this.state.y);
    }
    scaleData = (xx,yy) => {   
        if(!xx){
            xx = this.state.x;
            yy = this.state.y;
        }

        let max_x = Math.max(...xx);
        let min_x = Math.min(...xx);

        let x = xx.map((A) => {
            //add the alowance of the y-axis
            return ((A - min_x)/(max_x - min_x))*(this.state.width) + this.state.axes.y.width;
        });

        let allY = [];
        for(var zz in yy){
            allY = allY.concat(yy[zz]);
        }

        let max_y = Math.max(...allY);
        let min_y = Math.min(...allY);

        let y = {}, y_lower = {};
        for(var i  in yy){
            y[i] = [];
            y_lower[i] = [];
            for(var j = 1; j < yy[i].length; ++ j){

                let ssy = - ((yy[i][j] - min_y)/(max_y - min_y))*(this.state.height) + this.state.height;
                
                let ssy_lower = - ((yy[i][j] - min_y)/(max_y - min_y))*(this.state.lower_height) + this.state.lower_height;

                y[i].push(ssy)
                y_lower[i].push(ssy_lower);
            }
        }
        this.setState({
            scaled : {
                range_x : xx,
                range_y : yy,
                x: x,
                y: y,
                y_lower : y_lower,
                all_y : allY
            }
        });
        return {
            "x" : x,
            "y" : y,
            "y_lower" : y_lower,
            "all_y" : allY
        }
    }
    invertScaleY = (scaled_value, min_y, range) => {
        const scaled = this.state.scaled;
        const y = scaled.all_y.sort((a,b) => a - b);
        const l = y.length - 1;
        min_y = min_y || y[0];
        range = range || (y[l] - y[0]);
        
        return ((- scaled_value + this.state.height)/this.state.height) * range + min_y;
    }
    invertScaleX = (scaled_value, min_x, range) => {
        const scaled = this.state.scaled;
        const x = scaled.x.sort((a,b) => a - b);
        const l = x.length - 1;
        min_x = min_x || x[0];
        range = range || (x[l] - x[0]);

        return ((scaled_value - this.state.axes.y.width)/this.state.width) * range + min_x;
    }
    scaleXAxis = (delta) => {
        const sec = 1000, //default
        mins = 60 * sec, // delta > 
        hrs = 60 * mins, // delta > 6*hours
        days = 24 * hrs, // delta > 4*days
        weeks = 7 * days, // delta > 4*weeks 
        months = 31 * days, // delta > 4 * months 
        year = 365 * days; // delta > 3*year
        var x = [];
        const st_w = this.state.width;
        const st_y_w = this.state.axes.y.width;

        function populateTimeSeries(f_delta,time_factor,format){
            let x = [];
            const start_time = new Date(f_delta.range_x.min);
            x.push(start_time
                .format("monthDateYear")
                ); 
            //fill first entry with full dateTime
            var i = start_time.getTime() + time_factor;
    
            let scaledPos = [];
            scaledPos.push(0)
            
            while(true){
                const dt = new Date(i);
                x.push(dt.format(format));
    
                const scaledInterval = ((dt.getTime() - f_delta.range_x.min)/(f_delta.x))*(st_w) + st_y_w;
    
                scaledPos.push(scaledInterval);
    
                i += time_factor;
                if(i > f_delta.range_x.max)
                    break;
            }
        
            return {
                values: x,
                plot : scaledPos
            };
        }
        
        if(delta.x > 4*year){
            x.push(new Date(delta.range_x.min).getFullYear());
            for(var i = x[0] + 1; i <= delta.x + 1; i+= year){
                x.push(i);
            }
        }else if(delta.x > 3*year){
            x = populateTimeSeries(delta,6*months,"monthYear");
        }else if(delta.x > year){
            x = populateTimeSeries(delta,3**months,"monthYear");
        }else if(delta.x > 6*months){
            x = populateTimeSeries(delta,2*months,"monthYear");
        }
        
        else if(delta.x > 4*months){
            x = populateTimeSeries(delta,months,"monthDateYear");
        }

        else if(delta.x > 12*weeks){
            x = populateTimeSeries(delta,3*weeks,"monthDateYear");
        }else if(delta.x > 8*weeks){
            x = populateTimeSeries(delta,2*weeks,"monthDateYear");
        }else if(delta.x > 4*weeks){
            x = populateTimeSeries(delta,weeks,"monthDate");
        }

        else if(delta.x > 3*weeks){
            x = populateTimeSeries(delta,3*days,"monthDate");
        }else if(delta.x > 1.5*weeks){
            x = populateTimeSeries(delta,2*days,"monthDate");
        }else if(delta.x > weeks){
            x = populateTimeSeries(delta,days,"monthDate");
        }
        
        else if(delta.x > 2*days){
            x = populateTimeSeries(delta,18*hrs,"time24");
        }else if(delta.x > days){
            x = populateTimeSeries(delta, 12*hrs,"time24");
        }else if(delta.x > 18*hrs){
            x = populateTimeSeries(delta, 6*hrs,"time24");
        }else if(delta.x > 12*hrs){
            x = populateTimeSeries(delta,3*hrs,"time24");
        }else if(delta.x > 8*hrs){
            x = populateTimeSeries(delta,2*hrs,"time24");
        }
        
        
        else if(delta.x > hrs){
            x = populateTimeSeries(delta,20*mins,"time24");
        }else if(delta.x > 30*mins){
            x = populateTimeSeries(delta,5*mins,"time24");
        }else if(delta.x > 20*mins){
            x = populateTimeSeries(delta,3*mins,"time24");
        }else if(delta.x > 12*mins){
            x = populateTimeSeries(delta,2*mins,"time24");
        }else if(delta.x > mins){
            x = populateTimeSeries(delta,mins,"time24");
        }      
        else if(delta.x > 30*sec){
            x = populateTimeSeries(delta,5*sec,"isoTime");
        }else if(delta.x > 20*sec){
            x = populateTimeSeries(delta,3*sec,"isoTime");
        }else if(delta.x > 12*sec){
            x = populateTimeSeries(delta,2*sec,"isoTime");
        }else{
            x = populateTimeSeries(delta,sec,"isoTime");
        }

        return {
            x : x.values,
            x_plot: x.plot
        }
    }
    plotAxes = (xx, yy) => {
        const mn_x = Math.min(...xx),
                mx_x = Math.max(...xx);

       const delta = {
            x : mx_x - mn_x,
            range_x : {
                min : mn_x,
                max : mx_x
            }
        }
        const x_axis  = this.scaleXAxis(delta);

        const canvas = this.refs.canvas_upper;
        const ctx = canvas.getContext("2d");

        //clear x axis
        ctx.clearRect(0,this.state.height,canvas.width + 2*this.state.axes.y.width, this.state.axes.x.height);
        
        //clear y axis
        ctx.clearRect(0,0,this.state.axes.y.width, canvas.height);

        ctx.lineWidth = this.state.grid.lineWidth;
        ctx.strokeStyle = this.state.grid.strokeStyle;
        
        ctx.font = this.state.axes.font;
        ctx.fillStyle = this.state.axes.font_color;
    
        const sorted_y = yy.sort((a,b) => a-b);
        const range_y = sorted_y[sorted_y.length - 1] - sorted_y[0];

        if(this.state.grid.y){                
            ctx.beginPath();
            ctx.lineTo(this.state.axes.y.width, 0);
            ctx.lineTo(this.state.width + this.state.axes.y.width, 0);  
            ctx.stroke(); 
        } 
        for(var j = 0, i = 1; j < 10; j++, --i){
            const y_level = this.state.height +  i * 45;
            if(this.state.grid.y){                
                ctx.beginPath();
                ctx.lineTo(this.state.axes.y.width, y_level);
                ctx.lineTo(this.state.width + this.state.axes.y.width, y_level);  
                ctx.stroke(); 
            }              
            const real_y_val = this.invertScaleY(y_level,sorted_y[0],range_y);
            if(j){
                ctx.fillText(Math.round(real_y_val),0, y_level );  
            }
        }
        
        const num_axis_entries = x_axis.x_plot.length;
        const y_text = this.state.height + this.state.axes.x.height/2;
        
        for(var k = 0; k < num_axis_entries; k++){
            if(this.state.grid.x){
                ctx.beginPath();
                if(k === 0){
                    ctx.moveTo(this.state.axes.y.width, 0);
                    ctx.lineTo(this.state.axes.y.width, this.state.height);   
                }else{
                    ctx.moveTo(x_axis.x_plot[k], 0);
                    ctx.lineTo(x_axis.x_plot[k], this.state.height);   
                }                
                
                ctx.stroke(); 
            }
            ctx.fillText(x_axis.x[k],x_axis.x_plot[k], y_text);
        }       
    }
    plotUpper = (xx, yy) => {
        if(!xx){
            xx = this.state.x;
            yy = this.state.y;
        }

        const canvas = this.refs.canvas_upper;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const slider = this.state.slider;
        const slider_rel_x = slider.x - this.state.axes.y.width;

        const start_index = Math.floor(xx.length * slider_rel_x/(this.state.width)) ;

        const end_index = Math.round(xx.length * (slider_rel_x + slider.width)/(this.state.width- 1.9*slider.lineWidth));

        let x = xx.slice(start_index, end_index), y = {};
        for(var k in yy){
            y[k] = yy[k].slice(start_index, end_index);
        }

        const scaled = this.scaleData(x,y);
        this.plotAxes(x, scaled.all_y);

        ctx.lineWidth = .5;
        for(var i in scaled.y){
            ctx.strokeStyle = this.props.colors[i];
            ctx.beginPath();
            for(var j = 0; j < scaled.y[i].length; ++ j){
                ctx.lineTo(scaled.x[j], scaled.y[i][j] );
                ctx.stroke();  
            }
        }
        
    }
    plotLower = (x,y) => {
        if(!x){
            x = this.state.x;
            y = this.state.y;
        }else{
            this.setState({x:x});
            this.setState({y:y});
        }
        

        const scaled = this.scaleData(x,y);
        const canvas = this.refs.canvas_lower;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 1;
        for(var i in scaled.y_lower){
            ctx.strokeStyle = this.props.colors[i];
            ctx.beginPath(); 
            for(var j = 0; j < scaled.y_lower[i].length; ++ j){
                ctx.lineTo(scaled.x[j], scaled.y_lower[i][j]);
                ctx.stroke();  
            }
        }
        
        this.plotSlider();
        this.plotUpper();   
    }
    plotSlider = () =>{
        const canvas = this.refs.canvas_lower;
        const ctx = canvas.getContext("2d");
        //draw the active part
        ctx.beginPath();

        ctx.lineWidth = this.state.slider.lineWidth;
        ctx.rect(
            this.state.slider.x,
            this.state.slider.y,
            this.state.slider.width,
            this.state.slider.height);
            ctx.strokeStyle = this.state.slider.stroke;
        ctx.stroke();

        //draw the inactive parts
        ctx.beginPath();
        ctx.rect(
            this.state.axes.y.width-this.state.slider.lineWidth/2,
            this.state.slider.y,
            this.state.slider.x - this.state.axes.y.width,
            this.state.slider.height);
        
        ctx.fillStyle = this.state.slider.fill;
        ctx.fill();

        //draw the extra inactive part after the active
        ctx.beginPath();
        ctx.rect(
            this.state.slider.x + this.state.slider.width + this.state.slider.lineWidth/2,
            this.state.slider.y,
            this.state.width - (this.state.slider.x + this.state.slider.width),
            this.state.slider.height);
        
        ctx.fillStyle = this.state.slider.fill;
        ctx.fill();
    }
    mouseDown = (e) => {
        const canvas = this.refs.canvas_lower;
        const pos = e.clientX || e.touches[0].clientX;

        //destroy the info box
        this.setState({info_box : {
            index : -1
        }});
        
        const rel_pos = pos - canvas.getBoundingClientRect().left;
        
        let slider = this.state.slider
        const pullArea = {
            "left" : {
                "lower" : slider.x - slider.lineWidth,
                "upper" : slider.x + slider.lineWidth,
            },
            "right" : {
                "lower" : slider.x + slider.width - slider.lineWidth,

                "upper" : slider.x + slider.width + slider.lineWidth,
            }
        }

        if(rel_pos > pullArea.left.upper 
            && rel_pos < pullArea.right.lower            ){ //we are draging whole slider
            
            slider.drag = true;
            slider.x_at_mouse_down = rel_pos;
            this.setState({slider});

        }else if(rel_pos >= pullArea.left.lower && rel_pos <= pullArea.left.upper){ //we are pulling to the left
            
            slider.x_at_mouse_down = rel_pos;
            slider.grow.left = true;

            this.setState({slider});
        }else if(rel_pos >= pullArea.right.lower && rel_pos <= pullArea.right.upper){ //we are pulling to the right
            
            slider.x_at_mouse_down = rel_pos;
            slider.grow.right = true;
            this.setState({slider});
        }        
    }
    mouseUp = (e) => {
        let slider = this.state.slider
        slider.drag = false;
        slider.grow.right = false;
        slider.grow.left = false;
        slider.x_at_mouse_down = 0;
        this.setState({slider});
    }
    mouseMove = (e) => {  
        const canvas = this.refs.canvas_lower;
        const pos = e.clientX || e.touches[0].clientX;;
        const rel_pos = pos - canvas.getBoundingClientRect().left;      
        
        let slider = this.state.slider;
        var displacement = (rel_pos - slider.x_at_mouse_down) * slider.slide_factor;
        slider.x_at_mouse_down = rel_pos;  

        if(this.state.slider.drag){             
            // slider.slide_factor makes sliding it smoother
            const ctrl = displacement + slider.x;
            if( ctrl < this.state.axes.y.width){
                displacement = 0 
            }else if(ctrl + slider.width > this.state.width){
                displacement = this.state.width - (slider.width + slider.x);
                slider.drag = false;
            }
            slider.x += displacement;
            this.setState({slider});
            this.plotLower();
        }
        else if(this.state.slider.grow.left){
            const ctrl = displacement + slider.x;
            const width_ctrl = slider.width - displacement;
        
            if(ctrl > this.state.axes.y.width && width_ctrl > slider.min_width){
                slider.x += displacement;
                slider.width -= displacement;
                this.setState({slider});
                this.plotLower();
            }
            
        }else if(this.state.slider.grow.right){
            const ctrl = displacement + slider.x + slider.width;
            const width_ctrl = slider.width + displacement;
        
            if(ctrl < this.state.width 
                && width_ctrl < this.state.width
                && width_ctrl > slider.min_width){
                slider.width += displacement;
                this.setState({slider});
                this.plotLower();
            }
        }
    }
    moveOverUpper = (e) =>{
        const canvas = this.refs.canvas_upper;
        const pos = e.clientX || e.touches[0].clientX;;
        const rel_pos = pos - canvas.getBoundingClientRect().left;
        const ctx = canvas.getContext("2d");

        if(rel_pos < this.state.grid.y.width){
            return;
        }
        const index = this.state.scaled.x.findIndex((a) => {
            return a > rel_pos;
        }) - 1
        

        if(index >= 0){
            this.setState({info_box : {
                    index : index,
                    x : rel_pos - this.state.axes.y.width
                }
            },() =>{
                this.plotUpper()    
                ctx.strokeStyle = "#333";
                ctx.lineWidth = "1";
                ctx.beginPath()
                ctx.lineTo(rel_pos, 0);
                ctx.lineTo(rel_pos, this.state.height);
                ctx.stroke(); 

                /*ctx.lineWidth = "2";
                for(var i in this.state.scaled.y){
                    ctx.beginPath();
                    ctx.strokeStyle = this.props.colors[i]
                    ctx.arc(rel_pos, this.state.scaled.y[i][index], 5, 0, 2 * Math.PI);
                    ctx.stroke();
                } */             
            })                      
        }        
    }
    infoBoxContent(){
        const index = this.state.info_box.index || -1;
        if(index < 0){
            return;
        }
        const date = this.state.scaled.range_x[index];
        const details = []
            for(var i in this.state.y) {
                const col = this.props.colors[i]
                details.push(<div key={i} style={{color : col}} className="d-inline-flex mr-1 text-center">
                        <h4>
                            {
                                this.state.scaled.range_y[i][index]
                            } <br/>
                            <small>{i}</small>
                        </h4>
                    </div>
                );
            };
        return (
            <div className="">
                <div className="info-date" key={"date"}>
                    {new Date(date).format("dayMonthDateYear")}
                </div>
                {details}
            </div>            
        );
    }   
    getInforBoxClass(){
        const index = this.state.info_box.x || -1;
        return (index < 0) ? "info-box d-none" : "info-box d-flex";
    }
    render () {
    
        return (
            <div onMouseUp={this.mouseUp} className="chart-area d-block">
                <div className={this.getInforBoxClass()} style={{left:this.state.info_box.x}}>
                    {this.infoBoxContent()}
                </div>
                <canvas 
                    ref="canvas_upper" 
                    width={this.state.width + 2*this.state.axes.y.width} 
                    height={this.state.height + this.state.axes.x.height} 
                    onMouseMove={this.moveOverUpper} 
                />
                <canvas 
                    ref="canvas_lower" 
                    width={this.state.width} 
                    height={this.state.lower_height} 
                    onMouseDown={this.mouseDown.bind(this)} 
                    onMouseMove={this.mouseMove} 
                    onMouseUp={this.mouseUp} 
                    onPointerDown={this.mouseDown} 
                    onPointerMove={this.mouseMove} 
                    onPointerDown={this.mouseDown} 
                    onTouchStart={this.mouseDown}
                    onTouchMove={this.mouseMove}
                    onTouchEnd={this.mouseUp}
                    />
               
            </div>
        )
    }

}

export default Canvas;
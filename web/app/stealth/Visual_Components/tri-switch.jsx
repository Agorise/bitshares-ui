import React from "react";
import {PropTypes} from "react";
class TriSwitch extends React.Component {

    static propTypes = {
        label: React.PropTypes.string.isRequired,
        cpx: React.PropTypes.array,
        color_state: React.PropTypes.array,
        text: React.PropTypes.array
    };
    static defaultProps = {
        cpx: [3,16,30],
        color_state: [[204,204,204],[218,195,20],[186,15,0]],
        text: [],
        positions: 3,
        Auto: true
    }
    constructor() {
        super();
        this.state = {
            selection: 0,
            cpos: 3,
            c: [204,204,204],
            intervalid: null,
        };     
        this.handleChange = this.handleChange.bind(this);
    }
    /* colorlogic(param1,param2)
    * @param1: Array containing the current color
	* @param2: Array containing the desired color such as [218, 195, 20]
	* returns [true,color] if the colors are the same as the desired ones, [false,color] otherwise.
    */colorlogic(xc,dc)
    {
        var c = [Number(xc[0]),Number(xc[1]),Number(xc[2])];
        var dif = 10;//Must be higher than speed of color change I sugest leaving it at 10 and speeds could vary between 1-10
                        //This is the diference between the desired color and the color to know what numbers we can add/substract
        var spdf = 6;//This could count as speed of color change higher is faster.
        for(var i=0;i<3;i++)
        {
            if(c[i]<dc[i]){if((dc[i]-c[i])>dif){c[i] = c[i] + spdf;}else{c[i]++;}} //RGB INCREASE
            if(c[i]>dc[i]){if((c[i]-dc[i])>dif){c[i] = c[i] - spdf;}else{c[i]--;}} //RGB DECREASE
        }
        if(c[0] == dc[0] && c[1] == dc[1] && c[2] == dc[2])
        {
            return [true,c];
        }
        return [false,c];
    }
    /* movecircle(param1,param2)
    * @param1: current position(Probably needs to be Number()-ed)
    * @param2: desired position of the circle such as 3,16,30 (left,mid,right)
	* returns [true,position] if the position is the same as the desired one [false,color] otherwise.
    */movecircle(cpos,dp)
    {
        if(cpos<dp){cpos++;}if(cpos>dp){cpos--;}
        if(cpos==dp){return [true,cpos];}
        return [false,cpos];
    }
    /* Animation_Logic()
     * Calculates & sets values returned by the animation functions. 
    */Animation_Logic()
    {
        var mc = this.movecircle(Number(this.state.cpos),this.props.cpx[this.state.selection]);
        var cl = this.colorlogic(this.state.c,this.props.color_state[this.state.selection]);
        if(mc[0]&&cl[0]){clearInterval(this.state.intervalid);}
        this.setState({cpos: mc[1], c: [cl[1][0],cl[1][1],cl[1][2]]});
    }
    /*handleChange()
     * Sets next state & triggers animation_logic
    */handleChange()
    {
        if(this.props.Auto === true)//If you want to handle this externally set auto to false..
        {
            clearInterval(this.state.intervalid);
            let state = this.state.selection;
            if(state==this.props.positions-1){ state = 0; }else{ state++; }
            this.setState({selection: state, intervalid: setInterval(this.Animation_Logic.bind(this),2)});
        }
    }
    render()
    {
        return(
            <div id="tri-switch-container">
                <div id="tri-switch-background" ref="Background" onClick={this.handleChange} style={{backgroundColor: "rgb(" + this.state.c[0]+","+this.state.c[1]+","+this.state.c[2]+")"}}> 
                    <div id="tri-switch-circle" ref="Circle" style={{marginLeft: this.state.cpos}}/>
                </div>
                <div id="tri-switch-text"><p>{this.props.text[this.state.selection]}</p></div>
            </div>
        );
    }
    
}
export default TriSwitch;
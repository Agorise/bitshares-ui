import React from "react";
import {PropTypes} from "react";
class StealthCheckBox extends React.Component {

    static propTypes = {
        onChange: PropTypes.func,
        id: PropTypes.string.isRequired,
        checked: PropTypes.bool
    };
    static defaultProps = {
        checked: false
    }
    constructor() {
        super();
        this.state = {
            checked: null
        };

        this.handleChange = this.handleChange.bind(this);
    }
    getvalue()
    {
        return this.state.checked;
    }
    handleChange(e) {
        e.stopPropagation();
        let Mimi = document.getElementById("AS-LABEL");
        let check = this.state.checked;
        if (this.props.onChange)
        {
            this.props.onChange(this.state);
        }
        if(!check){
            this.setState({checked: true});
            this.setState({value: "yes"});
            Mimi.innerText="Associate with account:";
            return true;
        }
        else if(check){
            this.setState({checked: false});
            this.setState({value: "no"});
            Mimi.innerText = "Pay with account:";
            return false;
        }
    }
    checkit()
    {
        this.refs.stealthcheckinput.checked = true;
    }
    uncheckit()
    {
        this.refs.stealthcheckinput.checked = false;
    }
    focus(){
        this.refs.stealthcheckinput.focus;
    }
    render()
    {
        return(
            <div className="switch" onClick={this.handleChange} style={{}}>
                <input
                    type="checkbox"
                    ref="stealthcheckinput"
                    id={this.props.id}
                    checked={this.state.checked}
                    onChange={this.handleChange}
                />
                <label/>
            </div>
        );
    }
    
}
export default StealthCheckBox;
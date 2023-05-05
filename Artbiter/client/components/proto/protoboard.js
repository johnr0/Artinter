import React, {Component} from 'react'

class ProtoBoard extends Component {
    state={
        boardname: '',

        control_state: 'move_board', //'move_board
        action:'idle', // move_board
        boardcenter: [0.5,  0.5], // the view of the board
        boardzoom: 1,
        boardlength:0, 

        boardheight: 0,
        boardwidth: 0,

        // variables about moving board
        move_board_init: undefined,
        move_board_mouse_init: undefined,
    }

    componentDidMount(){
        console.log(this.state.boardname)
        if(document.getElementById(this.state.boardname)!=undefined){
            this.setboardlength()
            window.addEventListener('resize', this.setboardlength.bind(this))
        }


    }

    setboardlength(){
        var boardwidth = document.getElementById(this.state.boardname).offsetWidth
        var boardheight = document.getElementById(this.state.boardname).offsetHeight
        var boardlength = (boardwidth>boardheight)?boardheight:boardwidth
        console.log(boardlength)
        this.setState({boardlength:boardlength, boardheight:boardheight, boardwidth: boardwidth})
    }

    zoom_board_wheel(e){
        // console.log(e.deltaY)
        if(this.state.action=='idle'){
            var boardzoom_new = this.state.boardzoom-e.deltaY/100
            if(boardzoom_new<0.5){
                this.setState({boardzoom: 0.5})
            }else if(boardzoom_new>10){
                this.setState({boardzoom: 10})
            }else{
                this.setState({boardzoom: boardzoom_new})
            }
        }    
    }

    

    moveMouse(e){
            // console.log(this.state.move_board_init, this.state.move_board_mouse_init)
            // console.log(this.state.move_board_init[0]-(e.pageX-this.state.move_board_mouse_init[0])/100/this.state.boardzoom)
            var boardX = this.state.move_board_init[0]-(e.pageX-this.state.move_board_mouse_init[0])/this.state.boardwidth/this.state.boardzoom
            var boardY = this.state.move_board_init[1]-(e.pageY-this.state.move_board_mouse_init[1])/this.state.boardheight/this.state.boardzoom
            if (boardX<0.1){
                boardX = 0.1
            }else if(boardX>0.9){
                boardX = 0.9
            }

            if(boardY<0.1){
                boardY = 0.1
            }else if(boardY>0.9){
                boardY = 0.9
            }
            this.setState({boardcenter: [boardX, boardY]})
        
    }


    // functions for moving board
    moveBoardInit(e){
            this.setState({action:'move_board', move_board_init: this.state.boardcenter.slice(), move_board_mouse_init: [e.pageX, e.pageY]})
        
    }
    moveBoardEnd(e){
            this.setState({action:'idle', move_board_init: undefined, move_board_mouse_init:undefined})
        
    }

    render(){
        var boardlength = 0

        return (<div className='col s6 oneboard'>
            <h2>Protoboard</h2>
            <div id={this.state.boardname} className={this.state.boardname} onWheel={this.zoom_board_wheel.bind(this)} 
                //onPointerOut={this.moveBoardEnd.bind(this)}
                //onPointerMove={this.moveMouse.bind(this)}
                > 
                <div className='boardrender' //onPointerDown={this.moveBoardInit.bind(this)} onPointerUp={this.moveBoardEnd.bind(this)} 
                
                style={{
                    width:this.state.boardzoom*this.state.boardlength, 
                    height: this.state.boardzoom*this.state.boardlength,
                    top: this.state.boardheight/2-this.state.boardzoom*this.state.boardlength*this.state.boardcenter[1],
                    left: this.state.boardwidth/2-this.state.boardzoom*this.state.boardlength*this.state.boardcenter[0],
                }}>

                </div>
            </div>
        </div>)
    }
}

export default ProtoBoard
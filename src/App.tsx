import React from 'react';
import logo from './logo.svg';
import './bootstrap.min.css';
import { connect } from 'react-redux';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

function getFromServer(path:string, params:{}, callBackFunc:Function):void{
  var ajax = new XMLHttpRequest();
  ajax.onreadystatechange = function(){
    if(this.readyState === 4 && this.status === 200){
      console.log('Retrieve data successfully...');
      callBackFunc(true, this.responseText);
    }
    else if(this.readyState === 4) {
      console.log('Failed to retrieve data...');
      console.log('this.readyState = ' + this.readyState + ', this.status = ' + this.status);
      callBackFunc(false, this.responseText);
    }
  }
  ajax.open('GET', 'getdata', true);
  //ajax.setRequestHeader('Content-type', 'multipart/form-data');
  //var formData = new FormData(form);
  //ajax.send(formData);
  ajax.send();
}

class MyDataTable extends React.Component {
  state:any;
  constructor(props:{}) {
    super(props);
    this.state = {message: ''};
    this.processServerResponse = this.processServerResponse.bind(this);
  }

  processServerResponse(isSuccess:boolean, response:string):void{
    if(isSuccess){
      this.setState({message: response});
    }
    else {
      this.setState({message:'Failed to retrieve data from server...'});
    }
  }

  componentDidMount() {
    getFromServer('getdata', {}, this.processServerResponse);
  }

  componentWillUnmount() {
  }

  shouldComponentUpdate(nextProps, nextState){
    return this.state.message !== nextState.message;
  }

  render(){
    const message:string = this.state.message;
    return (<span>{message}</span>
    );
  }
}

class BootBox extends React.Component {
  render(){
    const mStyle:{} = {display: 'block'};
      return(
<div>
<div className="container">
  <h2>Modal Example</h2>
  <button type="button" className="btn btn-info btn-lg" data-toggle="modal" data-target="#myModal">Open Modal</button>

  <div className="modal show" id="myModal" role="dialog" style={mStyle}>
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h4 className="modal-title">Modal Header</h4>  
          <button type="button" className="close" data-dismiss="modal">&times;</button>

        </div>
        <div className="modal-body">
          <p>Some text in the modal.</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-danger" data-dismiss="modal">Close</button>
        </div>
      </div>
      
    </div>
  </div>
</div>
<div className="modal-backdrop show"></div>
</div>
      );
    }
  }
/*
const App: React.FC = () => {
  return (
    <div>
      <MyDataTable/>   
    </div>
  );
}
*/
//=======================================================================================================
//#######################################################################################################
//=======================================================================================================
// Reducers
  
type TodoState = {
  currentText:string;
  todoList:[];
  previousAction:string;
  todoListFilter:string;
  todoListName:string;
  todoLists:[];
  isShowTodoListMenu:boolean;
};

const InitialState:TodoState = {
  currentText: '',
  todoList: [],
  previousAction: '',
  todoListFilter: 'all',
  todoListName: '',
  todoLists:[],
  isShowTodoListMenu: false
};

type TodoListItem = {
  text:string;
  isActive:boolean;
};

function myReducer(state:TodoState = InitialState, action:any){
  let newState = JSON.parse(JSON.stringify(state));
  switch(action.type){
    case 'SET_CURRENT_TEXT':
      newState.currentText = action.value;
      newState.previousAction = 'SET_CURRENT_TEXT';
      break;
    case 'ADD_ITEM':
      if(state.currentText){
        newState.todoList.push({text: state.currentText, isActive: true});
        newState.currentText = '';
        newState.previousAction = 'ADD_ITEM';
      }
      break;
    case 'TOGGLE_ITEM':
      const toggledFlag = !newState.todoList[action.listIndex].isActive;
      newState.todoList[action.listIndex].isActive = toggledFlag;
      newState.previousAction = 'TOGGLE_ITEM';
      break;
    case 'FILTER_LIST':
      const filters = ['all', 'active', 'completed'];
      if(filters.includes(action.todoListFilter)){
        newState.todoListFilter = action.todoListFilter;
        newState.previousAction = 'FILTER_LIST';
      }
      break;
    case 'TOGGLE_TODOLIST_MENU':
      newState.isShowTodoListMenu = !state.isShowTodoListMenu;
      break;
    default:
      break;
  }
  return newState;
}

const myStore = createStore(myReducer);

//=======================================================================================================
// Actions

function setCurrentText(text){
  return {type: 'SET_CURRENT_TEXT', value: text};
}

function addItem(){
  return {type: 'ADD_ITEM'};
}

function toggleItem(listIndex){
  return {type: 'TOGGLE_ITEM', listIndex: listIndex};
}

function setFilter(filter){
  return {type: 'FILTER_LIST', todoListFilter: filter};
}

function toggleTodoListMenu(){
  return {type: 'TOGGLE_TODOLIST_MENU'};
}

//=======================================================================================================
// Todo component

type TodoInputProps = {
  currentText:string;
  setCurrentText:Function;
  addItem:Function;
}
class TodoInput extends React.Component {
  
  props:TodoInputProps;

  constructor(props:TodoInputProps){
    super(props);
    this.changeInput = this.changeInput.bind(this);
    this.addTodo = this.addTodo.bind(this);
  }

  changeInput(event){
    this.props.setCurrentText(event.target.value);
  }

  addTodo(){
    this.props.addItem();
  }

  render(){
    return(
      <div className='row'>
        <div className='col-9'>
          <input className='form-control' type='text' onChange={this.changeInput} value={this.props.currentText}/>&nbsp;
        </div>
        <div className='col-3'>
          <button className='btn btn-primary float-right' onClick={this.addTodo}>Add Todo</button>
        </div>
      </div>
    );
  }
}

const mapStateToProps1 = (state, props) => {
  if(state.previousAction = 'ADD_ITEM'){
    return {currentText: state.currentText};
  }
  return {};
};

const mapDispatchToProps1 = {
  setCurrentText, addItem
};

const TodoInput1 = connect(mapStateToProps1, mapDispatchToProps1)(TodoInput);

type TodoListProps = {
  toggleItem:Function;
  todoListFilter:string;
  todoItems:[];
};

//=======================================================================================================
// Todo list component
class TodoList extends React.Component {

  props:TodoListProps;

  constructor(props:TodoListProps){
    super(props);
    this.toggleLineItem = this.toggleLineItem.bind(this);
  }

  toggleLineItem(event){
    this.props.toggleItem(event.target.dataset.index);
  }

  render(){
    let currentList:any = [];
    if(this.props.todoItems){
      for(let i = 0; i < this.props.todoItems.length; i++){
        const todoItem:TodoListItem = this.props.todoItems[i];
        const isActive:boolean = todoItem.isActive;
        const filter:string = this.props.todoListFilter;
        const inlineStyle = isActive ? 'list-group-item active' : 'list-group-item';
        const text:string = todoItem.text;
        if(filter === 'all' || (filter === 'active' && isActive) || 
          (filter === 'completed' && !isActive)){
          currentList.push(<li className={inlineStyle} key={i} data-index={i} onClick={this.toggleLineItem} >{text}</li>);    
        }
      }
    }
    return(<ul className='list-group mb-2'>{currentList}</ul>);
  }
}

const mapStateToProps2 = (state, props) => 
  ({todoItems: state.todoList, todoListFilter: state.todoListFilter});

const mapDispatchToProps2 = {
  toggleItem
};

const TodoList1 = connect(mapStateToProps2, mapDispatchToProps2)(TodoList);

//=======================================================================================================
// Todo list footer component

type TodoFooterProps = {
  todoListFilter:string;
  setFilter:Function;
};

class TodoFooter extends React.Component {
  
  props:TodoFooterProps;

  constructor(props:TodoFooterProps){
    super(props);
    this.buttonClick = this.buttonClick.bind(this);
  }

  buttonClick(event){
    const id = event.target.id;
    switch(id){
      case 'all':
      case 'active':
      case 'completed':
        this.props.setFilter(id);
        break;
      default:
        break;
    }
  }

  render(){
    const filter = this.props.todoListFilter;
    const disabled = [('all' === filter ? true : false),
      ('active' === filter ? true : false),
      ('completed' === filter ? true : false) ];
    return(<div>
      <button className='btn btn-secondary' id='all' onClick={this.buttonClick} disabled={disabled[0]}>All</button>&nbsp;
      <button className='btn btn-info' id='active' onClick={this.buttonClick} disabled={disabled[1]}>Active</button>&nbsp;
      <button className='btn btn-success' id='completed' onClick={this.buttonClick} disabled={disabled[2]}>Completed</button>
    </div>);
  }
}

const mapStateToProps3 = (state, props) => 
  ({todoListFilter: state.todoListFilter});

const mapDispatchToProps3 = {
  setFilter
};

const TodoFooter1 = connect(mapStateToProps3, mapDispatchToProps3)(TodoFooter);

//=======================================================================================================
// Todo list header
/*
type TodoHeaderProps = {
  isShowTodoListMenu:boolean;
  todoListName:string;
  newTodoList:Function;
  deleteTodoList:Function;
  buttonClick:Function;
  toggleTodoListMenu:Function;
};
*/
type TodoHeaderProps = {
  isShowTodoListMenu:boolean;
  toggleTodoListMenu:Function;
}

class TodoHeader extends React.Component {
  
  props:TodoHeaderProps;

  constructor(props:TodoHeaderProps){
    super(props);
    this.newTodoList = this.newTodoList.bind(this);
    this.deleteTodoList = this.deleteTodoList.bind(this);
    this.buttonClick = this.buttonClick.bind(this);
  }

  newTodoList(){
  }

  deleteTodoList(){
  }

  buttonClick(event){
    let id = event.target.id;
    if(id === 'todoDropDown'){
      this.props.toggleTodoListMenu();
    }
  }

  render(){
    const todoListName:string = '(Unsaved list)';
    let todoListNames:any[] = [];
    for(let i = 1; i <= 10; i++){
      todoListNames.push(<a key={i} className='dropdown-item' href='#'>Link {i}</a>);
    }
    let dropDownMenuClass:string = 'dropdown-menu';
    if(this.props.isShowTodoListMenu){
      dropDownMenuClass += ' show';
    }
    return(
      <div className='row mb-3'>
        <div className='col'>
          <div className='dropdown'>
            <button id='todoDropDown' className='btn btn-primary dropdown-toggle' onClick={this.buttonClick}>
              {todoListName}
            </button>
            <div className={dropDownMenuClass}>
              {todoListNames}
            </div>
          </div>    
        </div>
        <div className='col'>
          <div className='float-right'>     
            <button className='btn btn-primary' id='new' onClick={this.buttonClick} >New</button>&nbsp;
            <button className='btn btn-warning' id='delete' onClick={this.buttonClick} >Delete</button>
          </div>
        </div>
     </div>
    );
  }
};

const mapStateToProps4 = (state, props) => 
  ({isShowTodoListMenu: state.isShowTodoListMenu});

const mapDispatchToProps4 = {
  toggleTodoListMenu
};

const TodoHeader1 = connect(mapStateToProps4, mapDispatchToProps4)(TodoHeader);

//=======================================================================================================
// Modal component

type MyModalProps = {
  isActive:boolean;
};

class MyModal extends React.Component {
  render(){
    return(
      <div></div>   
    );
  }
};

//=======================================================================================================

// Main application 
const App:React.FC = () => {
  return (
   <Provider store={myStore}>
    <div className='w-50 m-3'>
      <TodoHeader1/>
      <TodoInput1/>
      <TodoList1/>        
      <TodoFooter1/>
    </div>
   </Provider>
  );
}

export default App;

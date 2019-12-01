import React from 'react';
import ReactDOM from 'react-dom';
import './bootstrap.min.css';
import { connect } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import { makeRequest, getCookie, setCookie, deleteCookie } from './ServerTalk';
 
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

type TodoListItem = {
  text:string;
  isActive:boolean;
};

type TodoListObject = {
  _id: string;
  todoListName:string;
  todoListItems:TodoListItem[];
}

type TodoState = {
  currentText:string;
  todoListItems:[];
  previousAction:string;
  todoListFilter:string;
  todoListId: string;
  todoListName:string;
  todoLists:TodoListObject[];
  isShowTodoListMenu:boolean;
  isShowModal:boolean;
  modalType:string;
  modalError:string;
  jwtToken:string;
};

const InitialState:TodoState = {
  currentText: '',
  todoListItems: [],
  previousAction: '',
  todoListFilter: 'all',
  todoListId: '',
  todoListName: '',
  todoLists:[],
  isShowTodoListMenu: false,
  isShowModal: false,
  modalType: '',
  modalError: '',
  jwtToken: ''
};

function myReducer(state:TodoState = InitialState, action:any){
  let newState = JSON.parse(JSON.stringify(state));
        console.log(JSON.stringify(action));
  switch(action.type){
    case 'SET_CURRENT_TEXT':
      newState.currentText = action.value;
      break;
    case 'ADD_ITEM':
      if(state.currentText){
        newState.todoListItems.push({text: state.currentText, isActive: true});
        newState.currentText = '';
      }
      break;
    case 'TOGGLE_ITEM':
      const toggledFlag = !newState.todoListItems[action.listIndex].isActive;
      newState.todoListItems[action.listIndex].isActive = toggledFlag;
      break;
    case 'FILTER_LIST':
      const filters = ['all', 'active', 'completed'];
      if(filters.includes(action.todoListFilter)){
        newState.todoListFilter = action.todoListFilter;
      }
      break;
    case 'TOGGLE_TODOLIST_MENU':
      newState.isShowTodoListMenu = !state.isShowTodoListMenu;
      break;
    case 'DO_MODAL':

      newState.modalError = '';
      switch(action.operation){
        case 'SHOW_NEW':
        case 'SHOW_SAVE':
        case 'SHOW_DELETE':
          newState.isShowModal = true;
          break;
        case 'CREATE_LIST':
          if(checkListNameDuplicate(state, action.value)){
            newState.modalError = 'This name already exists.';
          }
          else {
            newState.todoListName = action.value;
            newState.isShowModal = false;
          }
          break;
        case 'SAVE_LIST':
          if(!action.isSuccess){
            newState.modalError = 'Failed to save list.';
          }
          else {
            newState.todoListId = action.result.insertedId || newState.todoListId;
            copyUpdateTodoList(newState);
            newState.isShowModal = false;
          }
          break;
        case 'DELETE_LIST':
          if(!action.isSuccess){
            newState.modalError = 'Failed to delete list.';
          }
          else {
            removeTodoList(newState, state.todoListId);
            newState.isShowModal = false;  
          }
          break;
        case 'HIDE':
          newState.isShowModal = false;
          break;
        default:
            break;
      }
      newState.modalType = action.modalType;
      break;
    case 'SET_TOKEN':
      newState.jwtToken = action.token;
      break;
    default:
      break;
  }
  newState.previousAction = action.type;
  return newState;
}

const myStore = createStore(myReducer, applyMiddleware(thunk));

//=======================================================================================================
// Utilities

function checkListNameDuplicate(state:TodoState, listName:string){

  for(let i = 0; i < state.todoLists.length; i++){
    if(state.todoLists[i].todoListName === listName.trim()){
      return true;
    }
  }
  return false;

}

function getCurrentTodoList(){

  const mainState = myStore.getState();
  const todoList = {
    _id: '',
    todoListName: mainState.todoListName,
    todoListItems: []
  };

  for(let i = 0; i < mainState.todoLists.length; i++){
    if(mainState.todoListName === mainState.todoLists[i].todoListName){
      todoList._id = mainState.todoLists[i]._id;
      break;
    }
  }
  for(let i = 0; i < mainState.todoListItems.length; i++){
    todoList.todoListItems.push(mainState.todoListItems[i]);
  }
  return todoList;  
}

function copyUpdateTodoList(state:TodoState){

  let todoList:TodoListObject = JSON.parse(JSON.stringify({
    _id: state.todoListId,
    todoListName: state.todoListName,
    todoListItems: state.todoListItems
  }));

  let isFoundExisting = false;

  for(let i = 0; i < state.todoLists.length; i++){
    if(state.todoLists[i].todoListName === todoList.todoListName){
      state.todoLists[i] = todoList;
      isFoundExisting = true;
      break;
    }
  }
  if(!isFoundExisting){
    state.todoLists.push(todoList);
  }
  return state;
}

function removeTodoList(state:TodoState, todoListId:string){

  if(todoListId){
    for(let i = 0; i < state.todoLists.length; i++){
      if(state.todoLists[i]._id === todoListId){
        state.todoLists.splice(i, 1);
        break;          
      }
    }
    state.todoListId = '';
    state.todoListName = '';
    state.todoListItems = [];
  }
}

//=======================================================================================================
// Actions

function setCurrentText(text:string){
  return {type: 'SET_CURRENT_TEXT', value: text};
}

function addItem(){
  return {type: 'ADD_ITEM'};
}

function toggleItem(listIndex:number){
  return {type: 'TOGGLE_ITEM', listIndex: listIndex};
}

function setFilter(filter:string){
  return {type: 'FILTER_LIST', todoListFilter: filter};
}

function toggleTodoListMenu(){
  return {type: 'TOGGLE_TODOLIST_MENU'};
}

function doModal(operation:string, value?:string){
  
  let isSuccess = false;
  let result = {};
  function doModal2(){
    console.log('dispatching...');
    const modalTypeMap = {
      'SHOW_NEW' : 'SHOW_NEW',  
      'SHOW_SAVE' : 'SHOW_SAVE',
      'SHOW_DELETE' : 'SHOW_DELETE',
      'CREATE_LIST': '',
      'SAVE_LIST' : '',
      'DELETE_LIST': '',
      'HIDE': ''
    };
    return {type: 'DO_MODAL', operation: operation, modalType: modalTypeMap[operation], value:value, isSuccess: isSuccess,
      result: result};      
  }
  const serverOperations = ['SAVE_LIST', 'DELETE_LIST'];

  return function(dispatch:Function){
//bookmark
    if(!serverOperations.includes(operation)){
      return function(){
        dispatch(doModal2());
      }
    }
    else {
      let path:string = '/';
      let method:string = 'GET';
      const currentList = getCurrentTodoList();
      let operationMap = {
        'SAVE_LIST': {
          method: 'POST',
          path: '/postdata',
          formFields: {command: 'SAVE_LIST', todoList: currentList}
        },
        'DELETE_LIST': {
          method: 'POST',
          path: '/postdata',
          formFields: {command: 'DELETE_LIST', _id: currentList._id}        
        }
      };
      const headerFields = {};
      const jwtToken = getCookie('token');
      if(jwtToken){
        headerFields['authorization'] = jwtToken;
      }
      method = operationMap[operation].method;
      path = operationMap[operation].path;
      const formFields = operationMap[operation].formFields;

      return makeRequest(path, method, headerFields, formFields).then(
        function(result:any){
          let parsedObj:any; 
          try {
            parsedObj = JSON.parse(result);
            isSuccess = parsedObj.isSuccess;
            result = parsedObj.result;
          }
          catch(error){
          }
          dispatch(doModal2());
        }
      );
    }
  }
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
  ({todoItems: state.todoListItems, todoListFilter: state.todoListFilter});

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

type TodoHeaderProps = {
  isShowTodoListMenu:boolean;
  todoListName:string;
  todoLists: TodoList[];
  toggleTodoListMenu:Function;
  doModal:Function;
}

class TodoHeader extends React.Component {
  
  props:TodoHeaderProps;

  constructor(props:TodoHeaderProps){
    super(props);
    this.buttonClick = this.buttonClick.bind(this);
  }

  buttonClick(event){
    let id = event.target.id;
    let data = event.target.dataset;
    if(id === 'todoDropDown'){
      this.props.toggleTodoListMenu();
    }
    else if(id === 'new'){
      this.props.doModal('SHOW_NEW');
    }
    else if(id === 'save'){
      this.props.doModal('SHOW_SAVE');
    }
    else if(id === 'delete'){
      this.props.doModal('SHOW_DELETE');
    }
    else if(data.islistitem === 'true'){
      this.props.toggleTodoListMenu();
    }
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  render(){
    let todoListName:string = this.props.todoListName ? this.props.todoListName : '(Unsaved list)';
    let todoListNames:{}[] = [];
    const todoLists = this.props.todoLists;
    for(let i = 0; i <= todoLists.length; i++){
      todoListNames.push(<a key={i} className='dropdown-item' href='#' onClick={this.buttonClick} data-islistitem='true'>todoLists[i].todoListName</a>);
    }
    let dropDownMenuClass:string = 'dropdown-menu';
    if(this.props.isShowTodoListMenu){
      dropDownMenuClass += ' show';
    }
    return(
      <div className='row mb-3'>
        <div className='col'>
          <div className='dropdown'>
            <button id='todoDropDown' className='btn btn-primary dropdown-toggle' onClick={this.buttonClick} onBlur={this.buttonClick}>
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
            <button className='btn btn-info' id='save' onClick={this.buttonClick} >Save</button>&nbsp;
            <button className='btn btn-warning' id='delete' onClick={this.buttonClick} >Delete</button>
          </div>
        </div>
     </div>
    );
  }
};

const mapStateToProps4 = (state, props) => 
  ({isShowTodoListMenu: state.isShowTodoListMenu, todoListName: state.todoListName, todoLists: state.todoLists});

const mapDispatchToProps4 = {
  toggleTodoListMenu,
  doModal
};

const TodoHeader1 = connect(mapStateToProps4, mapDispatchToProps4)(TodoHeader);

//=======================================================================================================
// Modal component

type MyModalProps = {
  isShowModal:boolean;
  modalType:string;
  modalError:string;
  doModal:Function;
};

class MyModal extends React.Component {
  
  props:MyModalProps;
  modalInputText:string;
  
  constructor(props:MyModalProps){
    super(props);
    this.state = {suppressUpdate: false};
    this.buttonClick = this.buttonClick.bind(this);
    this.onChangeInputText = this.onChangeInputText.bind(this);
    this.modalInputText = '';
  }

  onChangeInputText(event){
    let id = event.target.id;
    if(id === 'todoListNameInput'){
      this.modalInputText = event.target.value;
    }
  }

  buttonClick(event){
    console.log(JSON.stringify(this.props));
    let id = event.target.id;
/*
      'CREATE_LIST': 'HIDE',
      'SAVE_LIST' : 'HIDE',
      'DELETE_LIST' : 'HIDE',
*/    
    if(id === 'okay'){
      switch(this.props.modalType){
        case 'SHOW_NEW':
          if(this.modalInputText){
            this.props.doModal('CREATE_LIST', this.modalInputText); 
          }
          break;
        case 'SHOW_SAVE':
          break;
        case 'SHOW_DELETE':
        default:
          break;
      };//bookmark
    }
    else if(id === 'close'){
      this.props.doModal('HIDE');
    }
  }

  render(){
    const modalError = <span className='alert-danger'>{this.props.modalError}</span>;
    const modalTypeMap = {
      'SHOW_NEW' : {title: 'Create New List',
         body: 
           <div className='row'>
             <div className='col-4'>Todolist Name</div>
             <div className='col-8'>
               <input className='form-control' id='todoListNameInput' type='text' onChange={this.onChangeInputText} />
            </div>
           </div>
         },
      'SHOW_SAVE' : {title: 'Save List', body: <span>Do you want to save the current list?</span>},
      'SHOW_DELETE' : {title: 'Delete List', body: <span>Do you want to delete the current list?</span>},
      'NONE': {title: '', body: ''}
    };
    const modalType = this.props.modalType ? this.props.modalType : 'NONE';
    const modalTitle:string = modalTypeMap[modalType].title;
    const modalBody:string = modalTypeMap[modalType].body;
    const isShow = this.props.isShowModal ? 'show' : '';
    const mStyle:{} = isShow ? {display: 'block'} : {};
    const modalBackdrop:{} = isShow ? (<div className={"modal-backdrop show"}></div>) : [];
    return(
      <div>
        <div className="container">
          <div className="modal" id="myModal" style={mStyle}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">{modalTitle}</h4>  
                  <button type="button" id='close' className="close" data-dismiss="modal" onClick={this.buttonClick}>&times;</button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    {modalBody}
                  </div>
                  <div className="row">
                    {modalError}
                  </div>
                </div>
                <div className="modal-footer">
                  <div className="row">
                    <div className="col">
                      <button type="button" id='okay' className="btn btn-primary" data-dismiss="modal" onClick={this.buttonClick}>Confirm</button>
                    </div>                    
                    <div className="col">
                      <button type="button" id='close' className="btn btn-danger" data-dismiss="modal" onClick={this.buttonClick}>Close</button>
                    </div>
                  </div>
                </div>
              </div>      
            </div>
          </div>
        </div>
        {modalBackdrop}
      </div>
      );
    }
  }

const mapStateToProps5 = (state, props) => 
  ({isShowModal: state.isShowModal, modalType: state.modalType, modalError: state.modalError});

const mapDispatchToProps5 = {
  doModal
};

const MyModal1 = connect(mapStateToProps5, mapDispatchToProps5)(MyModal);
//=======================================================================================================
// Token validator component

type InitializeWrapProps = {
};

class InitializeWrap extends React.Component {

  props:InitializeWrapProps;
  state:any;
  This:InitializeWrap;

  constructor(props:InitializeWrapProps){
    super(props);
    this.state = {
      isTokenChecked: false,
      jwtToken: getCookie('token'),
      page: ''
    };
  }

  componentDidMount() {
    const This:any = this;
    if(this.state.jwtToken){
      if(!this.state.isTokenChecked){
        makeRequest('/postdata', 'POST', {'authorization':this.state.jwtToken}, 
          {command: 'VALIDATE_TOKEN'}).then(function(result:any){
          if(result.isSuccess){
            This.setState({isTokenChecked: true, page: 'account'});
          }
          else {
            This.setState({jwtToken: '', page: 'login'});
            deleteCookie('token');
          }
        });
      }
    }
    else {
      this.setState({isTokenChecked: true, page: 'login'});
    }
  }

  shouldComponentUpdate(nextProps, nextState){
    return this.state.page !== nextState.page || this.state.isTokenChecked !== nextState.isTokenChecked 
      || this.state.jwtToken !== nextState.jwtToken;
  }

  render(){
    if(!this.state.isTokenChecked){
      return(<div>Checking credentials...</div>);
    }
    else if(this.state.isTokenChecked && this.state.jwtToken && this.state.page === 'account'){
      return(
        <div className='w-50 m-3'>
          <TodoHeader1/>
          <TodoInput1/>
          <TodoList1/>        
          <TodoFooter1/>
          <MyModal1/>
        </div>
      );
    }
    else if(this.state.isTokenChecked && !this.state.jwtToken){
      if(this.state.page === 'login'){
        return(
          <div className='w-50 m-3'>
            <Login parent={this} />
          </div>
        );
      }
      else if(this.state.page === 'register'){
        return(
          <div className='w-50 m-3'>
            <Registration parent={this} />
          </div>
        );          
      }
    }
  }
}

//=======================================================================================================
// Registration component

class Registration extends React.Component {

  props:any;
  state:any;
  email:string;
  username:string;
  password:string;
  elements:any;
  inputs:any;

  constructor(props){
    super(props);
    this.state = {errorMessage: '', hasError:false};
    this.changeInput = this.changeInput.bind(this);
    this.click = this.click.bind(this);
    this.inputs = {
      email: {message: '', errorClass: '', value: ''},
      username: {message: '', errorClass: '', value: ''},
      password: {message: '', errorClass: '', value: ''}
    };
    deleteCookie('token');
  }

  changeInput(event){
    if(event.target.id === 'email'){
      this.inputs.email.value = event.target.value;
    }      
    else if(event.target.id === 'username'){
      this.inputs.username.value = event.target.value;
    }
    else if(event.target.id === 'password'){
      this.inputs.password.value = event.target.value;
    }   
  }

  click(event){
    let hasError:boolean = false;
    const This:any = this;
    if(event.target.id === 'gotoLogin'){
      this.props.parent.setState({page: 'login'});
      return;
    }
    if(event.target.id === 'signup'){
      if(!this.inputs.email.value){
        this.inputs.email.errorClass = 'is-invalid';
        this.inputs.email.message = 'Email address is required.';
        hasError = true;
      }
      else {
        this.inputs.email.errorClass = '';            
        this.inputs.email.message = '';        
      }
      if(!this.inputs.username.value){
        this.inputs.username.errorClass = 'is-invalid';
        this.inputs.username.message = 'Username is required.';
        hasError = true;
      }
      else {
        this.inputs.username.errorClass = '';
        this.inputs.username.message = '';              
      }
      if(!this.inputs.password.value){
        this.inputs.password.errorClass = 'is-invalid';
        this.inputs.password.message = 'Password is required.';
        hasError = true;
      }
      else {
        this.inputs.password.errorClass = '';
        this.inputs.password.message = '';         
      } 
      if(!hasError){
        makeRequest('/postdata', 'POST', {}, {command: 'CREATE_USER', email: this.inputs.email.value, 
          username: this.inputs.username.value, password: this.inputs.password.value}).then(function(result:any){
          if(result.isSuccess){
            This.setState({isSuccessfulAccountCreation: true});
            setCookie('token', result.token, 1);
          }
          else {
            This.setState({errorMessage: 'Failed to register account.'});
            deleteCookie('token');
          }
        });              
      } 
      else {
        this.setState({hasError: true});
      }      
    }
  }

  shouldComponentUpdate(nextProps, nextState){
    return this.state.hasError != nextState.hasError;
  }

  render(){
    let errorMessage = <span></span>;
    if(this.state.errorMessage){
      errorMessage = <span className='alert-danger'>{this.state.errorMessage}</span>;
    }
    if(this.state.isSuccessfulAccountCreation){
      return(
        <div>Successfully created account. Please <a href='#' id='gotoLogin' onClick={this.click}>here</a> 
          to go to the login page.
        </div>   
      );
    }
    return(     
      <div> 
        <div className='row'>
          {errorMessage}            
        </div>
        <h3>Register a New Account</h3>
        <div className='row'>
          <div className='col mt-1'>
           <label htmlFor='email'>Email</label>  
            <input id='email' className={'form-control ' + this.inputs.email.errorClass} type='text' onChange={this.changeInput} />
            <div className='invalid-feedback'>{this.inputs.email.message}</div>
          </div>
        </div>        
        <div className='row mt-1'>
          <div className='col'>
            <label htmlFor='username'>Username</label>  
            <input id='username' className={'form-control ' + this.inputs.username.errorClass} type='text' onChange={this.changeInput} />
            <div className='invalid-feedback'>{this.inputs.username.message}</div>
          </div>
        </div>
        <div className='row mt-1'>
          <div className='col'>
            <label htmlFor='password'>Password</label>  
            <input id='password' className={'form-control ' + this.inputs.password.errorClass} type='password' onChange={this.changeInput} />
            <div className='invalid-feedback'>{this.inputs.password.message}</div>
          </div>            
        </div>
        <div className='row mt-2'>
          <div className='col'>
            <button id='signup' className='btn btn-primary float-right' onClick={this.click}>Sign up</button>
          </div>            
        </div>
      </div>);
  }
}

//=======================================================================================================  
// Login component

class Login extends React.Component {

  username:string;
  password:string;
  props:any;
  state:any;

  constructor(props){
    super(props);
    this.changeInput = this.changeInput.bind(this);
    this.click = this.click.bind(this);
    this.state = {errorMessage: ''};
  }

  changeInput(event){
    if(event.target.id === 'username'){
      this.username = event.target.value;
    }
    else if(event.target.id === 'password'){
      this.password = event.target.value;
    }   
  }

  click(event){
    const This:any = this;
    if(event.target.id === 'signup'){
      this.props.parent.setState({page: 'register'});
    }
    else if(event.target.id === 'signin'){
      if(this.username && this.password){
        makeRequest('/postdata', 'POST', {}, {command: 'LOGIN', username: this.username, 
          password: this.password}).then(function(result:any){
          if(result.isSuccess){
            This.props.parent.setState({isTokenChecked: true, jwtToken: result.token, page: 'account'});
            setCookie('token', result.token, 1);
          }
          else {
            This.setState({errorMessage: 'Invalid username and/or password.'});
            deleteCookie('token');
          }
        });    
      }
    }
  }

  shouldComponentUpdate(nextProps, nextState){
    return this.state.errorMessage !== nextState.errorMessage;
  }

  render(){
    let errorMessage = <span></span>;
    if(this.state.errorMessage){
      errorMessage = <span className='alert-danger'>{this.state.errorMessage}</span>;
    }
    return(     
      <div> 
        <div className='row'>
          {errorMessage}            
        </div>
        <div className='row mt-2'>
          <div className='col'>
            <input id='username' className='form-control' type='text' onChange={this.changeInput} value={this.username} />
          </div>
        </div>
        <div className='row mt-2'>
          <div className='col'>
            <input id='password' className='form-control' type='text' onChange={this.changeInput} value={this.password} />
          </div>            
        </div>
        <div className='row mt-2'>
          <div className='col'>
            <button id='signin' className='btn btn-primary float-right' onClick={this.click}>Sign in</button>
          </div>            
        </div>
        <div className='row mt-2'>
          <div className='col'>
            <a href='#' id='signup' className='float-right' onClick={this.click}>Click here to signup</a>
          </div>            
        </div>        
      </div>);
  }
}

//=======================================================================================================
// Main application 

const App:React.FC = () => {

  const jwtToken = getCookie('token');
  if(jwtToken){
  }

  return (
   <Provider store={myStore}>
    <div className='w-50 m-3'>
      <InitializeWrap />
    </div>
   </Provider>
  );
}

export default App;

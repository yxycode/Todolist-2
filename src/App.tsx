import React from 'react';
import ReactDOM from 'react-dom';
import './bootstrap.min.css';
import { connect } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import { makeRequest } from './ServerTalk';
 
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
  todoListName:string;
  todoListItems:TodoListItem[];
}

type TodoState = {
  currentText:string;
  todoList:[];
  previousAction:string;
  todoListFilter:string;
  todoListName:string;
  todoLists:TodoListObject[];
  isShowTodoListMenu:boolean;
  isShowModal:boolean;
  modalType:string;
  modalError:string;
};

const InitialState:TodoState = {
  currentText: '',
  todoList: [],
  previousAction: '',
  todoListFilter: 'all',
  todoListName: '',
  todoLists:[],
  isShowTodoListMenu: false,
  isShowModal: false,
  modalType: '',
  modalError: ''
};

function checkListNameDuplicate(state:TodoState, listName:string){

  for(let i = 0; i < state.todoLists.length; i++){
    if(state.todoLists[i].todoListName === listName.trim()){
      return true;
    }
  }
  return false;
}

function myReducer(state:TodoState = InitialState, action:any){
  let newState = JSON.parse(JSON.stringify(state));
        console.log(JSON.stringify(action));
  switch(action.type){
    case 'SET_CURRENT_TEXT':
      newState.currentText = action.value;
      break;
    case 'ADD_ITEM':
      if(state.currentText){
        newState.todoList.push({text: state.currentText, isActive: true});
        newState.currentText = '';
      }
      break;
    case 'TOGGLE_ITEM':
      const toggledFlag = !newState.todoList[action.listIndex].isActive;
      newState.todoList[action.listIndex].isActive = toggledFlag;
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
          newState.isShowModal = false;
          break;
        case 'DELETE_LIST':
          newState.isShowModal = false;  
          break;
        case 'HIDE':
          newState.isShowModal = false;
          break;
        default:
            break;
      }
      newState.modalType = action.modalType;
      break;
    default:
      break;
  }
  newState.previousAction = action.type;
  return newState;
}

const myStore = createStore(myReducer, applyMiddleware(thunk));

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
    return {type: 'DO_MODAL', operation: operation, modalType: modalTypeMap[operation], value:value};      
  }
  const serverOperations = ['SAVE_LIST', 'DELETE_LIST'];

  return function(dispatch:Function){
//bookmark
    if(!serverOperations.includes(operation)){
      dispatch(doModal2());
    }
    else {
      let path:string = '/';
      let method:string = 'GET';
      if(operation === 'SAVE_LIST'){
        method = 'POST';
        path = '/postdata';
      }
      else if(operation === 'DELETE_LIST'){
        method = 'POST';
        path = '/postdata';
      }
      return makeRequest(path, method).then(
        function(result:string){
          let parsedObj:{}; 
          try {
            parsedObj = JSON.parse(result);
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
  todoListName:string;
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
    let todoListNames:any[] = [];
    for(let i = 1; i <= 10; i++){
      todoListNames.push(<a key={i} className='dropdown-item' href='#' onClick={this.buttonClick} data-islistitem='true'>Link {i}</a>);
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
  ({isShowTodoListMenu: state.isShowTodoListMenu, todoListName: state.todoListName});

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
    if(id == 'todoListNameInput'){
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
                  {modalBody}
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
  ({isShowModal: state.isShowModal, modalType: state.modalType});

const mapDispatchToProps5 = {
  doModal
};

const MyModal1 = connect(mapStateToProps5, mapDispatchToProps5)(MyModal);
//=======================================================================================================
// Registration component


//=======================================================================================================  
// Login component

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
      <MyModal1/>
    </div>
   </Provider>
  );
}

export default App;

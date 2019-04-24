import { createStore,applyMiddleware,compose} from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './reducers';  // we don't need to put index.js because it's recognized by default

const initialState = {};

const middleware = [thunk];

const store = createStore(
    rootReducer, 
    initialState,    
    compose( 
        applyMiddleware(...middleware),
        window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
    )
);

export default store;

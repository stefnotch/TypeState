namespace typestate {
   /**
    * Transition grouping to faciliate fluent api
    */
   export class Transitions<T extends object> {
      constructor(public fsm: FiniteStateMachine<T>) { }

      public fromStates: (keyof T)[];
      public toStates: (keyof T)[];


      /**
       * Specify the end state(s) of a transition function
       */
      public to(...states: (keyof T)[]) {
         this.toStates = states;
         this.fsm.addTransitions(this);
      }
      /**
       * Specify that any state in the state enum is value
       * Takes the state enum as an argument
       */
      public toAny() {
         var toStates: (keyof T)[] = [];
         Object.keys(this.fsm.contextContainer).forEach(s => {
            toStates.push(<keyof T>s);
         });

         this.toStates = toStates;
         this.fsm.addTransitions(this);
      }
   }

   /**
    * Internal representation of a transition function
    */
   export class TransitionFunction<T extends object> {
      constructor(public fsm: FiniteStateMachine<T>, public from: keyof T, public to: keyof T) { }
   }
   
   /**
    * A simple finite state machine implemented in TypeScript, the templated argument is meant to be used
    * with an enumeration.
    */
   export class FiniteStateMachine<T extends object> {
      public currentState: keyof T;
      public contextContainer: T;
      private _startState: keyof T;
      private _allowImplicitSelfTransition: boolean;
      private _transitionFunctions: TransitionFunction<T>[] = [];
      private _onCallbacks: { [key: string]: { (from: keyof T, context: T[keyof T], event?: any): void; }[] } = {};
      private _exitCallbacks: { [key: string]: { (to: keyof T, context: T[keyof T]): boolean; }[] } = {};
      private _enterCallbacks: { [key: string]: { (from: keyof T, context: T[keyof T], event?: any): boolean; }[] } = {};
      private _invalidTransitionCallback: (to?: keyof T, from?: keyof T) => boolean = null;

      constructor(contextContainer: T, startState: keyof T, allowImplicitSelfTransition: boolean = false) {
         this.contextContainer = contextContainer;
         this.currentState = startState;
         this._startState = startState;
         this._allowImplicitSelfTransition = allowImplicitSelfTransition;
      }

      public addTransitions(fcn: Transitions<T>) {
         fcn.fromStates.forEach(from => {
            fcn.toStates.forEach(to => {
                // Only add the transition if the state machine is not currently able to transition.
                if (!this._canGo(from, to)) {
                  this._transitionFunctions.push(new TransitionFunction<T>(this, from, to));
               }
            });
         });
      }

      /**
       * Listen for the transition to this state and fire the associated callback
       */
      public on<U extends keyof T>(state: U, callback: (from?: keyof T, context?: T[U], event?: any) => any): FiniteStateMachine<T> {
         var key = state.toString();
         if (!this._onCallbacks[key]) {
            this._onCallbacks[key] = [];
         }
         this._onCallbacks[key].push(callback);
         return this;
      }

      /**
       * Listen for the transition to this state and fire the associated callback, returning
       * false in the callback will block the transition to this state.
       */
      public onEnter<U extends keyof T>(state: U, callback: (from?: keyof T, context?: T[U], event?: any) => boolean): FiniteStateMachine<T> {
         var key = state.toString();
         if (!this._enterCallbacks[key]) {
            this._enterCallbacks[key] = [];
         }
         this._enterCallbacks[key].push(callback);
         return this;
      }

      /**
       * Listen for the transition to this state and fire the associated callback, returning
       * false in the callback will block the transition from this state.
       */
      public onExit<U extends keyof T>(state: U, callback: (to?: keyof T, context?: T[U]) => boolean): FiniteStateMachine<T> {
         var key = state.toString();
         if (!this._exitCallbacks[key]) {
            this._exitCallbacks[key] = [];
         }
         this._exitCallbacks[key].push(callback);
         return this;
      }
      
      /**
       * List for an invalid transition and handle the error, returning a falsy value will throw an
       * exception, a truthy one will swallow the exception
       */
      public onInvalidTransition(callback: (from?: keyof T, to?: keyof T) => boolean): FiniteStateMachine<T> {
         if(!this._invalidTransitionCallback){
            this._invalidTransitionCallback = callback
         }
         return this;
      }

      /**
       * Declares the start state(s) of a transition function, must be followed with a '.to(...endStates)'
       */
      public from(...states: (keyof T)[]): Transitions<T> {
         var _transition = new Transitions<T>(this);
         _transition.fromStates = states;
         return _transition;
      }

      public fromAny(): Transitions<T> {
         var fromStates: (keyof T)[] = [];
         Object.keys(this.contextContainer).forEach(s => {
            fromStates.push(<keyof T>s);
         });

         var _transition = new Transitions<T>(this);
         _transition.fromStates = fromStates;
         return _transition;
      }

      private _validTransition(from: keyof T, to: keyof T): boolean {
         return this._transitionFunctions.some(tf => {
            return (tf.from === from && tf.to === to);
         });
      }

      /**
       * Check whether a transition between any two states is valid.
       *    If allowImplicitSelfTransition is true, always allow transitions from a state back to itself.
       *     Otherwise, check if it's a valid transition.
       */
      private _canGo(fromState: keyof T, toState: keyof T): boolean {
          return (this._allowImplicitSelfTransition && fromState === toState) || this._validTransition(fromState, toState);
      } 

      /**
       * Check whether a transition to a new state is valid
       */
      public canGo(state: keyof T): boolean {
          return this._canGo(this.currentState, state);
      }

      /**
       * Transition to another valid state
       */
      public go<U extends keyof T>(state: U, contextCallback?: (context?: T[U]) => void, event?: any): void {
         if (!this.canGo(state)) {
            if(!this._invalidTransitionCallback || !this._invalidTransitionCallback(this.currentState, state)){
               throw new Error('Error no transition function exists from state ' + this.currentState.toString() + ' to ' + state.toString());
            }
         } else {
            this._transitionTo(state, contextCallback, event);
         }
      }

      /**
       * This method is availble for overridding for the sake of extensibility. 
       * It is called in the event of a successful transition.
       */
      public onTransition(from: keyof T, to: keyof T) {
         // pass, does nothing until overidden
      }

      /**
      * Reset the finite state machine back to the start state, DO NOT USE THIS AS A SHORTCUT for a transition. 
      * This is for starting the fsm from the beginning.
      */
      public reset(options?: ResetOptions) {
         options = { ...DefaultResetOptions, ...(options || {}) };
         this.currentState = this._startState;
         if (options.runCallbacks) {
            this._onCallbacks[this.currentState.toString()].forEach(fcn => {
               fcn.call(this, null, null);
            });
         }
      }
      
      /**
       * Whether or not the current state equals the given state
       */
      public is(state: keyof T): boolean {
          return this.currentState === state;
      }

      private _transitionTo<U extends keyof T>(state: U, contextCallback?: (context?: T[U]) => void, event?: any) {
         if (!this._exitCallbacks[this.currentState.toString()]) {
            this._exitCallbacks[this.currentState.toString()] = [];
         }

         if(contextCallback) contextCallback(this.contextContainer[state]);

         if (!this._enterCallbacks[state.toString()]) {
            this._enterCallbacks[state.toString()] = [];
         }

         if (!this._onCallbacks[state.toString()]) {
            this._onCallbacks[state.toString()] = [];
         }


         var canExit = this._exitCallbacks[this.currentState.toString()].reduce<boolean>((accum: boolean, next: (to: keyof T, context: T[keyof T]) => boolean) => {
            return accum && (<boolean>next.call(this, state, this.contextContainer[this.currentState]));
         }, true);

         var canEnter = this._enterCallbacks[state.toString()].reduce<boolean>((accum: boolean, next: (from: keyof T, context: T[keyof T], event?: any) => boolean) => {
            return accum && (<boolean>next.call(this, this.currentState, this.contextContainer[state], event));
         }, true);

         if (canExit && canEnter) {
            var old = this.currentState;
            this.currentState = state;
            this._onCallbacks[this.currentState.toString()].forEach(fcn => {
               fcn.call(this, old, this.contextContainer[state], event);
            });
            this.onTransition(old, state);
         }
      }
   }

   /**
    * Options to pass to the `reset()` method.
    */
   export interface ResetOptions {
      /** Whether or not the speciefied `on()` handlers for the start state should be called when resetted. */
      runCallbacks?: boolean;
   };

   /**
    * Default `ResetOptions` values used in the `reset()` mehtod.
    */
   export const DefaultResetOptions: ResetOptions = {
      runCallbacks: false
   };

}

// maintain backwards compatibility for people using the pascal cased version
var TypeState = typestate;

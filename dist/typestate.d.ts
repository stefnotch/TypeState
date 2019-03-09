declare namespace typestate {
    /**
     * Transition grouping to faciliate fluent api
     */
    class Transitions<T extends object> {
        fsm: FiniteStateMachine<T>;
        constructor(fsm: FiniteStateMachine<T>);
        fromStates: (keyof T)[];
        toStates: (keyof T)[];
        /**
         * Specify the end state(s) of a transition function
         */
        to(...states: (keyof T)[]): void;
        /**
         * Specify that any state in the state enum is value
         * Takes the state enum as an argument
         */
        toAny(): void;
    }
    /**
     * Internal representation of a transition function
     */
    class TransitionFunction<T extends object> {
        fsm: FiniteStateMachine<T>;
        from: keyof T;
        to: keyof T;
        constructor(fsm: FiniteStateMachine<T>, from: keyof T, to: keyof T);
    }
    /**
     * A simple finite state machine implemented in TypeScript, the templated argument is meant to be used
     * with an enumeration.
     */
    class FiniteStateMachine<T extends object> {
        currentState: keyof T;
        contextContainer: T;
        private _startState;
        private _allowImplicitSelfTransition;
        private _transitionFunctions;
        private _onCallbacks;
        private _exitCallbacks;
        private _enterCallbacks;
        private _invalidTransitionCallback;
        constructor(contextContainer: T, startState: keyof T, allowImplicitSelfTransition?: boolean);
        addTransitions(fcn: Transitions<T>): void;
        /**
         * Listen for the transition to this state and fire the associated callback
         */
        on<U extends keyof T>(state: U, callback: (from?: keyof T, context?: T[U], event?: any) => any): FiniteStateMachine<T>;
        /**
         * Listen for the transition to this state and fire the associated callback, returning
         * false in the callback will block the transition to this state.
         */
        onEnter<U extends keyof T>(state: U, callback: (from?: keyof T, context?: T[U], event?: any) => boolean): FiniteStateMachine<T>;
        /**
         * Listen for the transition to this state and fire the associated callback, returning
         * false in the callback will block the transition from this state.
         */
        onExit<U extends keyof T>(state: U, callback: (to?: keyof T, context?: T[U]) => boolean): FiniteStateMachine<T>;
        stateTimeout<U extends keyof T>(state: U, to: keyof T, timeout: number): void;
        /**
         * List for an invalid transition and handle the error, returning a falsy value will throw an
         * exception, a truthy one will swallow the exception
         */
        onInvalidTransition(callback: (from?: keyof T, to?: keyof T) => boolean): FiniteStateMachine<T>;
        /**
         * Declares the start state(s) of a transition function, must be followed with a '.to(...endStates)'
         */
        from(...states: (keyof T)[]): Transitions<T>;
        fromAny(): Transitions<T>;
        private _validTransition;
        /**
         * Check whether a transition between any two states is valid.
         *    If allowImplicitSelfTransition is true, always allow transitions from a state back to itself.
         *     Otherwise, check if it's a valid transition.
         */
        private _canGo;
        /**
         * Check whether a transition to a new state is valid
         */
        canGo(state: keyof T): boolean;
        /**
         * Transition to another valid state
         */
        go<U extends keyof T>(state: U, contextCallback?: (context?: T[U]) => void, event?: any): void;
        /**
         * This method is availble for overridding for the sake of extensibility.
         * It is called in the event of a successful transition.
         */
        onTransition(from: keyof T, to: keyof T): void;
        /**
        * Reset the finite state machine back to the start state, DO NOT USE THIS AS A SHORTCUT for a transition.
        * This is for starting the fsm from the beginning.
        */
        reset(options?: ResetOptions): void;
        /**
         * Whether or not the current state equals the given state
         */
        is(state: keyof T): boolean;
        private _transitionTo;
    }
    /**
     * Options to pass to the `reset()` method.
     */
    interface ResetOptions {
        /** Whether or not the speciefied `on()` handlers for the start state should be called when resetted. */
        runCallbacks?: boolean;
    }
    /**
     * Default `ResetOptions` values used in the `reset()` mehtod.
     */
    const DefaultResetOptions: ResetOptions;
}
declare var TypeState: typeof typestate;

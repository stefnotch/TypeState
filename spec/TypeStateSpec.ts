import "./support/jasmine";
import {typestate} from "../dist/typestate-node";
import {TypeState} from "../dist/typestate-node";

class ValidStates {
      A = 0;
      B = 1;
      C = 2;
      D = 3;
}

describe('A finite state machine', ()=>{
   var fsm: TypeState.FiniteStateMachine<ValidStates>;
   beforeEach(() => {
      fsm = new TypeState.FiniteStateMachine(new ValidStates(), "A");
   });

   it('should exist', ()=>{
      expect(typestate.FiniteStateMachine).toBeDefined();
   });

   it('should be backwards compatible', () => {
      expect(TypeState.FiniteStateMachine).toBeDefined();
   });

   it('backwards compatible can be instantiated', () => {
      var fsm2 = new TypeState.FiniteStateMachine<ValidStates>(new ValidStates(), "A");
      expect(fsm2).toBeTruthy();
   })

   it('can be instantiated with an object', ()=>{
      expect(fsm).toBeTruthy();
   });

   it('validates cannot transition to a state that is not defined', ()=>{
      expect(fsm.canGo("B")).toBeFalsy();
   });

   it('validates can transition to a state that is defined', () => {
      fsm.from("A").to("B");
      expect(fsm.canGo("B")).toBeTruthy();
   });

   it('validates cannot transition to a state not directly connected', () => {
      fsm.from("A").to("B");
      fsm.from("B").to("C");
      expect(fsm.canGo("C")).toBeFalsy();
   });

   it('can transition to a valid', () => {
      fsm.from("A").to("B");
      fsm.from("B").to("C");
      expect(fsm.currentState).toBe("A");
      fsm.go("B");
      expect(fsm.currentState).toBe("B");
      fsm.go("C");
      expect(fsm.currentState).toBe("C");
   });

   it('can handle cycles', () => {
      fsm.from("A").to("B");
      fsm.from("B").to("A");
      expect(fsm.currentState).toBe("A");

      fsm.go("B");
      expect(fsm.currentState).toBe("B");
      fsm.go("A");
      expect(fsm.currentState).toBe("A");

   });

   it('can define multiple transitions at once', () => {
      fsm.from("A", "B").to("A", "B");
      expect(fsm.currentState).toBe("A");

      fsm.go("B");
      expect(fsm.currentState).toBe("B");
      fsm.go("A");
      expect(fsm.currentState).toBe("A");
   });

   it('can handle the wildcard ".fromAny()" from state', ()=>{
      fsm.fromAny().to("B");

      this.currentState = "A";
      expect(fsm.canGo("B")).toBe(true);

      this.currentState = "B";
      expect(fsm.canGo("B")).toBe(true);

      this.currentState = "C";
      expect(fsm.canGo("B")).toBe(true);

      this.currentState = "D";
      expect(fsm.canGo("B")).toBe(true);
   });

   it('can handle the wildcard ".toAny()" to state', ()=>{
      fsm.from("A").toAny();

      expect(fsm.canGo("A")).toBe(true);
      expect(fsm.canGo("B")).toBe(true);
      expect(fsm.canGo("C")).toBe(true);
      expect(fsm.canGo("D")).toBe(true);
   });

   it('throws an error when transitioning to an invalid state', () => {
      fsm.from("A").to("B");
      expect(fsm.currentState).toBe("A");
      expect(() => { fsm.go("C"); }).toThrowError('Error no transition function exists from state ' + "A".toString() + ' to ' + "C".toString());
   });
   
   it('can handle an invalid state transition', () => {
      fsm.from("A").to("B");
      var fromResult: keyof ValidStates;
      var toResult: keyof ValidStates;
      fsm.onInvalidTransition((from, to) => {
         fromResult = from;
         toResult = to;
         return true;
      });
      fsm.go("C");
      expect(fromResult).toBe("A");
      expect(toResult).toBe("C");
      expect(fsm.currentState).toBe("A");
      
   });

   it('fires "on" callbacks when transitioning to a listend state', () => {
      fsm.from("A").to("B");
      var called = 0;
      var callback = () => {
         called += 1;
      };
      fsm.on("B", callback);
      fsm.go("B");
      expect(called).toBe(1);
   });

   it('can block transitions to by returning false onEnter events', () => {
      fsm.from("A").to("B");
      fsm.onEnter("B", () => {
         return false;
      });

      var called = 0;
      var callback = () => {
         called += 1;
      };

      fsm.on("B", callback);

      fsm.go("B");
      expect(fsm.currentState).toBe("A");
      expect(called).toBe(0);
   });

   it('can block transitions from by returning false onExit events', () => {
      fsm.from("A").to("B");
      fsm.from("B").to("A");
      fsm.onExit("B", () => {
         return false;
      });

      var called = 0;
      var callback = () => {
         called += 1;
      };

      fsm.on("A", callback);

      fsm.go("B");
      expect(fsm.currentState).toBe("B");

      fsm.go("A");
      expect(fsm.currentState).toBe("B");
      expect(called).toBe(0);
   });

   it('passes the "from" state to the ".on" callback', () => {
      fsm.from("A").to("B");
      fsm.from("B").to("A");
      var fromState: keyof ValidStates;
      fsm.on("B", (from: keyof ValidStates) => {
         fromState = from;
      });
      fsm.go("B");
      expect(fromState).toBe("A");
   });

   it('passes the "from" state to the ".onEnter" callback', ()=>{
      fsm.from("A").to("B");
      fsm.from("B").to("A");
      var fromState: keyof ValidStates;
      fsm.onEnter("B", (from: keyof ValidStates) => {
         fromState = from;
         return false;
      });
      fsm.go("B");
      expect(fromState).toBe("A");
   });

   it('passes the "to" state to the ".onExit" callback', ()=>{
      fsm.from("A").to("B");
      fsm.from("B").to("A");
      var toState: keyof ValidStates;
      fsm.onExit("A", (to: keyof ValidStates) => {
         toState = to;
         return false;
      });
      fsm.go("B");
      expect(toState).toBe("B");
      expect(fsm.currentState).toBe("A");
   });

   it('can be reset', () => {
      fsm.from("A").to("B");
      fsm.from("B").to("C");
      expect(fsm.currentState).toBe("A");
      fsm.go("B");
      expect(fsm.currentState).toBe("B");
      fsm.go("C");
      expect(fsm.currentState).toBe("C");
      fsm.reset();
      expect(fsm.currentState).toBe("A");
   });

   it('can be reset with optional options', () => {
      let onCallbackRan = false;
      fsm.from("A").to("B");
      fsm.on("A", () => {
         onCallbackRan = true;
      })
      fsm.go("B");
      expect(fsm.currentState).toBe("B");
      fsm.reset();
      expect(fsm.currentState).toBe("A");
      expect(onCallbackRan).toBe(false);
      fsm.go("B");
      expect(fsm.currentState).toBe("B");
      fsm.reset({runCallbacks: true});
      expect(fsm.currentState).toBe("A");
      expect(onCallbackRan).toBe(true);
   });

   it('can have the onTransition method overridden', () => {
      fsm.from("A").to("B");
      fsm.from("B").to("C");
      expect(fsm.currentState).toBe("A");
      var lastFrom: keyof ValidStates;
      var lastTo: keyof ValidStates;
      fsm.onTransition = function(from: keyof ValidStates, to: keyof ValidStates){
         lastFrom = from;
         lastTo = to;
      }

      fsm.go("B");
      expect(lastFrom).toBe("A");
      expect(lastTo).toBe("B");

      fsm.go("C");
      expect(lastFrom).toBe("B");
      expect(lastTo).toBe("C");

   });
   
   it('can compare current state', () => {
      expect(fsm.is("A")).toBe(true);
   });

   it('can pass event data on transition', () => {
      fsm.from("A").to("B");

      let eventData = 'test';
      let receivedData: any;

      fsm.on("B", (from: keyof ValidStates, context, data?: any) => {
         receivedData = data;
      });

      fsm.go("B", null, eventData);
      expect(fsm.currentState).toBe("B");
      expect(receivedData).toBe(eventData);
   });

   it('doesn\'t allow states to transition into themselves by default', () => {
       expect(fsm.canGo("A")).toBe(false);
   });

   it('can allow states to transition into themselves by default', () => {
       var fsm2 = new TypeState.FiniteStateMachine<ValidStates>(new ValidStates(),"A", true);
       expect(fsm2.canGo("A")).toBe(true);
   });

   it('can pass a context between transitions', () => {
      class ValidStatesWithContext {
         A = {a:1};
         B = {b: 1};
         C = null;
      }
      var fsm2 = new TypeState.FiniteStateMachine<ValidStatesWithContext>(new ValidStatesWithContext(), "A", true);
      fsm2.from("A").to("B");
      fsm2.from("B").to("C");

      fsm2.onEnter("B", (from, context) => {
         expect(context.b).toBe(7);
         return true;
      });
      fsm2.on("B", (from, context) => {
         expect(context.b).toBe(7);
      });
      fsm2.onExit("B", (from, context) => {
         expect(context.b).toBe(7);
         return true;
      });
      fsm2.on("C", (from, context) => {
         expect(context).toBe(null);
      });

      fsm2.go("B", (context) => { 
         expect(context.b).toBe(1);
         context.b = 7;
      });

      fsm2.go("C", (context) => {expect(context).toBe(null)});
   })
});

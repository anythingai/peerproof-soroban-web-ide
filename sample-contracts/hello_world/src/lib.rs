#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Env, Symbol, Vec};

/// A simple "Hello World" Soroban smart contract demonstrating basic functionality.
/// This contract includes common patterns like storage, events, and different data types.
#[contract]
pub struct HelloContract;

#[contractimpl]
impl HelloContract {
    /// Returns a greeting message combined with the provided name.
    /// 
    /// # Arguments
    /// * `to` - The name to greet (as a Symbol)
    /// 
    /// # Returns
    /// A Symbol containing "Hello" + the provided name
    pub fn hello(env: Env, to: Symbol) -> Symbol {
        // Log the greeting for debugging
        env.events().publish(
            (symbol_short!("hello"),), 
            (symbol_short!("called"), to.clone())
        );
        
        // Return a simple greeting
        symbol_short!("Hello")
    }
    
    /// Increments a given number by 1.
    /// Demonstrates basic arithmetic operations.
    /// 
    /// # Arguments
    /// * `value` - The number to increment
    /// 
    /// # Returns
    /// The incremented value
    pub fn increment(env: Env, value: u32) -> u32 {
        let result = value.saturating_add(1);
        
        // Emit an event for the increment operation
        env.events().publish(
            (symbol_short!("inc"),), 
            (value, result)
        );
        
        result
    }
    
    /// Stores a value in the contract's persistent storage.
    /// Demonstrates how to use Soroban's storage system.
    /// 
    /// # Arguments
    /// * `key` - The storage key
    /// * `value` - The value to store
    pub fn store_value(env: Env, key: Symbol, value: u32) {
        env.storage().persistent().set(&key, &value);
        
        env.events().publish(
            (symbol_short!("store"),), 
            (key, value)
        );
    }
    
    /// Retrieves a value from the contract's persistent storage.
    /// 
    /// # Arguments
    /// * `key` - The storage key to lookup
    /// 
    /// # Returns
    /// The stored value, or 0 if key doesn't exist
    pub fn get_value(env: Env, key: Symbol) -> u32 {
        env.storage().persistent().get(&key).unwrap_or(0)
    }
    
    /// Adds two numbers together.
    /// Simple demonstration of function with multiple parameters.
    /// 
    /// # Arguments
    /// * `a` - First number
    /// * `b` - Second number
    /// 
    /// # Returns
    /// Sum of a and b
    pub fn add(env: Env, a: u32, b: u32) -> u32 {
        let result = a.saturating_add(b);
        
        env.events().publish(
            (symbol_short!("add"),), 
            (a, b, result)
        );
        
        result
    }
    
    /// Returns a vector of numbers from 1 to n.
    /// Demonstrates working with vectors in Soroban.
    /// 
    /// # Arguments
    /// * `n` - The upper limit (must be <= 10 for efficiency)
    /// 
    /// # Returns
    /// A vector containing numbers from 1 to n
    pub fn get_numbers(env: Env, n: u32) -> Vec<u32> {
        if n > 10 {
            panic!("Number too large, maximum is 10");
        }
        
        let mut vec = Vec::new(&env);
        for i in 1..=n {
            vec.push_back(i);
        }
        
        env.events().publish(
            (symbol_short!("numbers"),), 
            (n, vec.len())
        );
        
        vec
    }
    
    /// Returns the current contract version.
    /// Useful for contract upgrades and version tracking.
    pub fn version() -> Symbol {
        symbol_short!("v1.0.0")
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Events, Ledger};
    use soroban_sdk::{symbol_short, vec, Env};

    #[test]
    fn test_hello() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HelloContract);
        let client = HelloContractClient::new(&env, &contract_id);

        let result = client.hello(&symbol_short!("World"));
        assert_eq!(result, symbol_short!("Hello"));
        
        // Check that event was emitted
        let events = env.events().all();
        assert_eq!(events.len(), 1);
    }

    #[test]
    fn test_increment() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HelloContract);
        let client = HelloContractClient::new(&env, &contract_id);

        assert_eq!(client.increment(&5), 6);
        assert_eq!(client.increment(&u32::MAX), u32::MAX); // Test overflow protection
    }

    #[test]
    fn test_storage() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HelloContract);
        let client = HelloContractClient::new(&env, &contract_id);

        let key = symbol_short!("test_key");
        let value = 42u32;

        // Store value
        client.store_value(&key, &value);
        
        // Retrieve value
        let retrieved = client.get_value(&key);
        assert_eq!(retrieved, value);
        
        // Test non-existent key
        let missing = client.get_value(&symbol_short!("missing"));
        assert_eq!(missing, 0);
    }

    #[test]
    fn test_add() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HelloContract);
        let client = HelloContractClient::new(&env, &contract_id);

        assert_eq!(client.add(&10, &20), 30);
        assert_eq!(client.add(&u32::MAX, &1), u32::MAX); // Test overflow protection
    }

    #[test]
    fn test_get_numbers() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HelloContract);
        let client = HelloContractClient::new(&env, &contract_id);

        let result = client.get_numbers(&5);
        let expected = vec![&env, 1, 2, 3, 4, 5];
        assert_eq!(result, expected);
    }

    #[test]
    #[should_panic(expected = "Number too large")]
    fn test_get_numbers_too_large() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HelloContract);
        let client = HelloContractClient::new(&env, &contract_id);

        client.get_numbers(&15); // Should panic
    }

    #[test]
    fn test_version() {
        assert_eq!(HelloContract::version(), symbol_short!("v1.0.0"));
    }
}

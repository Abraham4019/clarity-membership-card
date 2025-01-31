import {
    Clarinet,
    Tx,
    Chain,
    Account,
    types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Test membership issuance",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('membership', 'issue-membership', [
                types.principal(wallet1.address),
                types.ascii("PREMIUM"),
                types.uint(365)
            ], deployer.address)
        ]);
        
        block.receipts[0].result.expectOk();
        assertEquals(block.receipts[0].result, types.ok(types.uint(1)));
    }
});

Clarinet.test({
    name: "Test points addition",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        
        chain.mineBlock([
            Tx.contractCall('membership', 'issue-membership', [
                types.principal(wallet1.address),
                types.ascii("PREMIUM"),
                types.uint(365)
            ], deployer.address)
        ]);
        
        let block = chain.mineBlock([
            Tx.contractCall('membership', 'add-points', [
                types.uint(1),
                types.uint(100)
            ], deployer.address)
        ]);
        
        block.receipts[0].result.expectOk();
        
        let response = chain.callReadOnlyFn(
            'membership',
            'get-membership',
            [types.uint(1)],
            deployer.address
        );
        
        response.result.expectOk();
        let membership = response.result.expectOk().expectTuple();
        assertEquals(membership['points'], types.uint(100));
    }
});

Clarinet.test({
    name: "Test reward redemption",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        
        chain.mineBlock([
            Tx.contractCall('membership', 'issue-membership', [
                types.principal(wallet1.address),
                types.ascii("PREMIUM"),
                types.uint(365)
            ], deployer.address),
            Tx.contractCall('membership', 'add-reward', [
                types.ascii("REWARD1"),
                types.ascii("Free Coffee"),
                types.uint(50)
            ], deployer.address),
            Tx.contractCall('membership', 'add-points', [
                types.uint(1),
                types.uint(100)
            ], deployer.address)
        ]);
        
        let block = chain.mineBlock([
            Tx.contractCall('membership', 'redeem-reward', [
                types.uint(1),
                types.ascii("REWARD1")
            ], wallet1.address)
        ]);
        
        block.receipts[0].result.expectOk();
        
        let response = chain.callReadOnlyFn(
            'membership',
            'get-membership',
            [types.uint(1)],
            deployer.address
        );
        
        response.result.expectOk();
        let membership = response.result.expectOk().expectTuple();
        assertEquals(membership['points'], types.uint(50));
    }
});

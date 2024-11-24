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
    name: "Test membership validation",
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
            Tx.contractCall('membership', 'is-valid-member', [
                types.uint(1)
            ], deployer.address)
        ]);
        
        block.receipts[0].result.expectOk();
        assertEquals(block.receipts[0].result, types.ok(true));
    }
});

Clarinet.test({
    name: "Test membership transfer",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        const wallet2 = accounts.get('wallet_2')!;
        
        chain.mineBlock([
            Tx.contractCall('membership', 'issue-membership', [
                types.principal(wallet1.address),
                types.ascii("PREMIUM"),
                types.uint(365)
            ], deployer.address)
        ]);
        
        let block = chain.mineBlock([
            Tx.contractCall('membership', 'transfer-membership', [
                types.uint(1),
                types.principal(wallet2.address)
            ], wallet1.address)
        ]);
        
        block.receipts[0].result.expectOk();
    }
});
import { describe, it, expect } from "vitest";
import { Keypair, Account, TransactionBuilder, Operation, Asset, BASE_FEE, Networks, TimeoutInfinite } from "@stellar/stellar-sdk";
import { StellarClient } from "@lumen/core";
import { CosignerService } from "../cosigner/service.js";
import { PolicyEngine } from "../policy/engine.js";
import { EnvSigner } from "../signers/EnvSigner.js";

describe("CosignerService TimeBounds & Expiration Enforcement", () => {
  const cosignerKeypair = Keypair.random();
  const signer = new EnvSigner(cosignerKeypair.secret());
  const client = new StellarClient({ network: "local" });
  const userKeypair = Keypair.random();
  const dummyAccount = new Account(userKeypair.publicKey(), "100");

  it("cosigns transaction when timebounds are valid and within limit", async () => {
    const policyEngine = new PolicyEngine();
    const cosigner = new CosignerService({
      client,
      signer,
      policyEngine,
      enforceTimeBounds: true,
      maxValidityWindowSeconds: 300,
    });

    const now = Math.floor(Date.now() / 1000);
    const tx = new TransactionBuilder(dummyAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.STANDALONE,
      timebounds: {
        minTime: now.toString(),
        maxTime: (now + 120).toString(),
      },
    })
      .addOperation(
        Operation.payment({
          destination: Keypair.random().publicKey(),
          asset: Asset.native(),
          amount: "10",
        })
      )
      .build();
    tx.sign(userKeypair);

    const result = await cosigner.cosign({
      xdr: tx.toXDR(),
      walletAddress: userKeypair.publicKey(),
    });

    expect(result.approved).toBe(true);
    expect(result.signedXdr).toBeTruthy();
  });

  it("rejects transaction when timebounds are missing and enforceTimeBounds is true", async () => {
    const policyEngine = new PolicyEngine();
    const cosigner = new CosignerService({
      client,
      signer,
      policyEngine,
      enforceTimeBounds: true,
    });

    const tx = new TransactionBuilder(dummyAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.STANDALONE,
    })
      .addOperation(
        Operation.payment({
          destination: Keypair.random().publicKey(),
          asset: Asset.native(),
          amount: "10",
        })
      )
      .setTimeout(TimeoutInfinite)
      .build();
    tx.sign(userKeypair);

    const result = await cosigner.cosign({
      xdr: tx.toXDR(),
      walletAddress: userKeypair.publicKey(),
    });

    expect(result.approved).toBe(false);
    expect(result.reason).toContain("unbounded");
  });

  it("rejects expired transaction", async () => {
    const policyEngine = new PolicyEngine();
    const cosigner = new CosignerService({
      client,
      signer,
      policyEngine,
      enforceTimeBounds: true,
    });

    const now = Math.floor(Date.now() / 1000);
    const tx = new TransactionBuilder(dummyAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.STANDALONE,
      timebounds: {
        minTime: (now - 600).toString(),
        maxTime: (now - 10).toString(),
      },
    })
      .addOperation(
        Operation.payment({
          destination: Keypair.random().publicKey(),
          asset: Asset.native(),
          amount: "10",
        })
      )
      .build();
    tx.sign(userKeypair);

    const result = await cosigner.cosign({
      xdr: tx.toXDR(),
      walletAddress: userKeypair.publicKey(),
    });

    expect(result.approved).toBe(false);
    expect(result.reason).toContain("expired");
  });

  it("rejects transaction exceeding maximum allowed validity window", async () => {
    const policyEngine = new PolicyEngine();
    const cosigner = new CosignerService({
      client,
      signer,
      policyEngine,
      enforceTimeBounds: true,
      maxValidityWindowSeconds: 60,
    });

    const now = Math.floor(Date.now() / 1000);
    const tx = new TransactionBuilder(dummyAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.STANDALONE,
      timebounds: {
        minTime: now.toString(),
        maxTime: (now + 300).toString(), // 300s > 60s
      },
    })
      .addOperation(
        Operation.payment({
          destination: Keypair.random().publicKey(),
          asset: Asset.native(),
          amount: "10",
        })
      )
      .build();
    tx.sign(userKeypair);

    const result = await cosigner.cosign({
      xdr: tx.toXDR(),
      walletAddress: userKeypair.publicKey(),
    });

    expect(result.approved).toBe(false);
    expect(result.reason).toContain("exceeds maximum allowed window");
  });
});

describe("CosignerService Security Validations", () => {
  const cosignerKeypair = Keypair.random();
  const signer = new EnvSigner(cosignerKeypair.secret());
  const client = new StellarClient({ network: "local" });
  const userKeypair = Keypair.random();
  const dummyAccount = new Account(userKeypair.publicKey(), "100");

  it("rejects fee-bump transactions with user-friendly error message", async () => {
    const policyEngine = new PolicyEngine();
    const cosigner = new CosignerService({
      client,
      signer,
      policyEngine,
    });

    const innerTx = new TransactionBuilder(dummyAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.STANDALONE,
    })
      .addOperation(
        Operation.payment({
          destination: Keypair.random().publicKey(),
          asset: Asset.native(),
          amount: "10",
        })
      )
      .setTimeout(180)
      .build();
    innerTx.sign(userKeypair);

    const feeBumpTx = TransactionBuilder.buildFeeBumpTransaction(
      cosignerKeypair,
      BASE_FEE * 2,
      innerTx,
      Networks.STANDALONE
    );
    feeBumpTx.sign(cosignerKeypair);

    const result = await cosigner.cosign({
      xdr: feeBumpTx.toXDR(),
      walletAddress: userKeypair.publicKey(),
    });

    expect(result.approved).toBe(false);
    expect(result.reason).toBe(
      "Fee-bump transactions are not accepted for co-signing. Please submit a regular transaction."
    );
  });

  it("rejects transaction when transaction source does not match wallet address", async () => {
    const policyEngine = new PolicyEngine();
    const cosigner = new CosignerService({
      client,
      signer,
      policyEngine,
    });

    const tx = new TransactionBuilder(dummyAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.STANDALONE,
    })
      .addOperation(
        Operation.payment({
          destination: Keypair.random().publicKey(),
          asset: Asset.native(),
          amount: "10",
        })
      )
      .setTimeout(180)
      .build();
    tx.sign(userKeypair);

    const otherWallet = Keypair.random().publicKey();
    const result = await cosigner.cosign({
      xdr: tx.toXDR(),
      walletAddress: otherWallet,
    });

    expect(result.approved).toBe(false);
    expect(result.reason).toBe("Transaction source does not match wallet address");
  });

  it("rejects transaction when wallet owner has not signed the transaction", async () => {
    const policyEngine = new PolicyEngine();
    const cosigner = new CosignerService({
      client,
      signer,
      policyEngine,
    });

    const tx = new TransactionBuilder(dummyAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.STANDALONE,
    })
      .addOperation(
        Operation.payment({
          destination: Keypair.random().publicKey(),
          asset: Asset.native(),
          amount: "10",
        })
      )
      .setTimeout(180)
      .build();
    // Intentionally unsigned

    const result = await cosigner.cosign({
      xdr: tx.toXDR(),
      walletAddress: userKeypair.publicKey(),
    });

    expect(result.approved).toBe(false);
    expect(result.reason).toBe("Transaction is not signed by the wallet owner");
  });

  it("rejects transaction when signed by another key instead of the wallet owner", async () => {
    const policyEngine = new PolicyEngine();
    const cosigner = new CosignerService({
      client,
      signer,
      policyEngine,
    });

    const tx = new TransactionBuilder(dummyAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.STANDALONE,
    })
      .addOperation(
        Operation.payment({
          destination: Keypair.random().publicKey(),
          asset: Asset.native(),
          amount: "10",
        })
      )
      .setTimeout(180)
      .build();

    const impostorKeypair = Keypair.random();
    tx.sign(impostorKeypair);

    const result = await cosigner.cosign({
      xdr: tx.toXDR(),
      walletAddress: userKeypair.publicKey(),
    });

    expect(result.approved).toBe(false);
    expect(result.reason).toBe("Transaction is not signed by the wallet owner");
  });

  it("approves and co-signs transaction when properly signed by wallet owner and source matches", async () => {
    const policyEngine = new PolicyEngine();
    const cosigner = new CosignerService({
      client,
      signer,
      policyEngine,
    });

    const tx = new TransactionBuilder(dummyAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.STANDALONE,
    })
      .addOperation(
        Operation.payment({
          destination: Keypair.random().publicKey(),
          asset: Asset.native(),
          amount: "10",
        })
      )
      .setTimeout(180)
      .build();
    tx.sign(userKeypair);

    const result = await cosigner.cosign({
      xdr: tx.toXDR(),
      walletAddress: userKeypair.publicKey(),
    });

    expect(result.approved).toBe(true);
    expect(result.signedXdr).toBeTruthy();
  });
});

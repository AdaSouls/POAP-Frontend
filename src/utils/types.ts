import { Data, MintingPolicy, SpendingValidator } from "https://unpkg.com/lucid-cardano@0.10.7/web/mod.js"

export type AppliedValidators = {
    mint: MintingPolicy;
    redeem: SpendingValidator;
    policyId: string;
    lockAddress: string;
};

const ScriptType = Data.Enum([
    Data.Literal("Sig"),
    Data.Literal("All"),
    Data.Literal("Any"),
    Data.Literal("AtLeast"),
    Data.Literal("After"),
    Data.Literal("Before"),
]);
type ScriptType = Data.Static<typeof ScriptType>;

const NativeScript = Data.Object({
    type: ScriptType,
    keyHash: Data.Nullable(Data.Bytes({ minLength: 28, maxLength: 28 })),
    slot: Data.Nullable(Data.Integer()),
    require: Data.Nullable(Data.Integer())
});
type NativeScript = Data.Static<typeof NativeScript>;

const PolicySchema = Data.Object({
    type: ScriptType,
    keyHash: Data.Nullable(Data.Bytes({ minLength: 28, maxLength: 28 })),
    slot: Data.Nullable(Data.Integer()),
    require: Data.Nullable(Data.Integer()),
    scripts: Data.Nullable(Data.Array(NativeScript))
});
export type Policy = Data.Static<typeof PolicySchema>;
export const Policy = PolicySchema as unknown as Policy;

const CredentialSchema = Data.Enum([
    Data.Object({ VerificationKeyCredential: Data.Tuple([Data.Bytes({ minLength: 28, maxLength: 28 })]) }),
    Data.Object({ ScriptCredential: Data.Tuple([Data.Bytes({ minLength: 28, maxLength: 28 })]) }),
]);
export type Credential = Data.Static<typeof CredentialSchema>;
export const Credential = CredentialSchema as unknown as Credential;

const MintSchema = Data.Object({
    policy: PolicySchema,
    script: CredentialSchema,
    nonce: Data.Bytes()
});
export type Mint = Data.Static<typeof MintSchema>;
export const Mint = MintSchema as unknown as Mint;

const MintRedeemerSchema = Data.Enum([
    Data.Object({ Mint: Data.Object({ msg: Data.Bytes() }) }),
    Data.Literal("Burn")
]);
export type MintRedeemer = Data.Static<typeof MintRedeemerSchema>;
export const MintRedeemer = MintRedeemerSchema as unknown as MintRedeemer;

const ClaimRedeemerSchema = Data.Enum([
    Data.Literal("ClaimToken"),
    Data.Object({ BurnToken: Data.Object({ policy: PolicySchema }) })
]);
export type ClaimRedeemer = Data.Static<typeof ClaimRedeemerSchema>;
export const ClaimRedeemer = ClaimRedeemerSchema as unknown as ClaimRedeemer;

const DatumMetadataSchema = Data.Object({
    policyId: Data.Bytes({ minLength: 32, maxLength: 32 }),
    beneficiary: Data.Bytes(),
    status: Data.Bytes(),
    metadata: Data.Object({
        data: Data.Any(),
        version: Data.Integer(),
        extra: Data.Nullable(Data.Any())
    }),
});
export type DatumMetadata = Data.Static<typeof DatumMetadataSchema>;
export const DatumMetadata = DatumMetadataSchema as unknown as DatumMetadata;
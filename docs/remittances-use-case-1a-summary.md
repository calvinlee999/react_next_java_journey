# Remittances Use-Case 1a: Account to Account - Summary

Based on PMPG Market Guidance (January 2025 v2.0)

## Use-Case Overview

**Description**: Cross-border payments between two natural persons (P2P) from bank account to bank account.

### Key Characteristics
- **Participants**: Both debtor and creditor are individuals (not legal entities)
- **Scope**: Cross-border transfers between accounts owned by respective parties
- **Currency**: Can be same currency or different currencies
- **Special Case**: Movement of funds where debtor and creditor are the same person

## Target Benefits

### For Debtor (Sender)
- **Transparency**: Clear fees, exchange rates, and timing
- **Traceability**: End-to-end payment tracking
- **Completion Alert**: Confirmation when payment arrives
- **Payment Accuracy**: Low likelihood of misrouted payments

### For Creditor (Recipient)
- **Identity Clarity**: Clear identification of payment sender
- **Transparency**: Visibility into fees, rates, and timing

### For Agents (Banks/PSPs)
- **Reduced Investigation Costs**: Better data quality reduces manual intervention
- **Improved Fraud Screening**: Enhanced data enables better risk assessment
- **Product Effectiveness**: Increased usage to compete with non-bank providers

## ISO 20022 Implementation Guidelines

### Message Structure (pacs.008)

#### Core Code Values
- **Category Purpose Code**: `GP2P` (General Person to Person)
- **Purpose Code**: 
  - `GIFT` (monetary gift)
  - `INTP` (intra-company payment for same-person transfers)

#### Required Data Elements
- **Structured Address Data**: Full postal address details
- **Party Identification**: Date of Birth, Place of Birth in structured form
- **Fee and FX Rate Transparency**: Clear cost breakdown

### Example Transaction
**Scenario**: Capitaine Archibald Haddock (Belgium) → Filemon Mortadelo (Mexico)

```xml
<PmtTpInf>
  <SvcLvl><Cd>G001</Cd></SvcLvl>
  <CtgyPurp><Cd>GP2P</Cd></CtgyPurp>
</PmtTpInf>
<ChrgBr>DEBT</ChrgBr>
<Dbtr>
  <Nm>Capitaine Archibald Haddock</Nm>
  <PstlAdr>
    <StrtNm>Rue d' Harmignies</StrtNm>
    <BldgNb>4A</BldgNb>
    <PstCd>7032</PstCd>
    <TwnNm>Mons</TwnNm>
    <Ctry>BE</Ctry>
  </PstlAdr>
  <Id><PrvtId><DtAndPlcOfBirth>...</DtAndPlcOfBirth></PrvtId></Id>
</Dbtr>
<Purp><Cd>GIFT</Cd></Purp>
```

## Industry Sectors
- **Workers Remittance**: Migrant worker transfers to home country
- **Private Banking**: High-value individual transfers
- **Overseas Banking**: Cross-border personal banking
- **Non-Resident Banking**: Transfers for non-resident accounts

## Implementation Challenges

### Creditor Agent (Receiving Bank)
- **Geographic Coverage**: Feedback needed from agents in key remittance countries (Mexico, India, Philippines)
- **Local Compliance**: Must align with local regulatory requirements

### Debtor Agent (Sending Bank)
- **System Updates**: Front-end systems and branch systems require modification
- **User Experience**: Enhanced data capture without friction

## Opportunities from Standardization

### Codewords (Immutability)
- **Category Purpose Code/Local Instrument Code**: Consistent remittance identification
- **Purpose Code**: Sub-type classification (gift, balance transfer, etc.)

### Enhanced Data Quality
- **Structured Addresses**: Improved delivery accuracy
- **Additional Party Identification**: Better compliance and fraud prevention
- **Fee and FX Transparency**: Regulatory compliance and customer experience

## Recommendations for Implementation

### Technical Requirements
1. **Message Format**: Implement pacs.008 with GP2P category purpose
2. **Data Validation**: Ensure structured address and party identification
3. **Fee Transparency**: Include all charges and FX rates upfront
4. **Tracking**: Implement end-to-end UETR (Unique End-to-End Transaction Reference)

### Business Considerations
1. **Competitive Positioning**: Use enhanced data to compete with non-bank providers
2. **Cost Reduction**: Leverage better data quality to reduce operational costs
3. **Customer Experience**: Focus on transparency and completion notifications
4. **Compliance**: Ensure alignment with local AML/KYC requirements

### Integration Points
1. **Core Banking Systems**: Account debiting and crediting
2. **SWIFT Network**: Message transmission with gpi tracking
3. **Customer Channels**: Mobile/web interfaces for initiation
4. **Compliance Systems**: AML screening and sanctions checking

## Success Metrics
- Reduction in payment investigations
- Improved customer satisfaction scores
- Increased cross-border payment volumes
- Enhanced fraud detection rates
- Faster settlement times

---
*Source: ISO 20022 Market Guidance, Payments Market Practice Group (PMPG), January 2025 v2.0*
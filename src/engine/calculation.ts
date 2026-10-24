import {
  Member,
  Expense,
  SettlementTransfer,
  TripCalculationResult,
  MemberExpenseSummary,
  ExpenseShareDetail,
  BeneficiaryShare,
  PairwiseDebt,
  DirectFriendSettlement,
} from '../types';
import { formatINR } from '../utils/currency';

/**
 * Distributes an expense amount in paise among N beneficiaries.
 * Remainder paise are deterministically allocated to the first `remainder` beneficiaries,
 * guaranteeing that sum(shares) === totalAmountPaise with zero rounding error.
 */
export function calculateBeneficiaryShares(
  amountPaise: number,
  beneficiaryIds: string[]
): { shares: BeneficiaryShare[]; baseShare: number; remainder: number } {
  const n = beneficiaryIds.length;
  if (n === 0 || amountPaise <= 0) {
    return {
      shares: beneficiaryIds.map((id) => ({ memberId: id, sharePaise: 0 })),
      baseShare: 0,
      remainder: 0,
    };
  }

  const baseShare = Math.floor(amountPaise / n);
  const remainder = amountPaise % n;

  // Stable sort of beneficiary IDs for deterministic remainder assignment
  const sortedIds = [...beneficiaryIds].sort();

  const shares: BeneficiaryShare[] = sortedIds.map((memberId, index) => {
    const isRemainderRecipient = index < remainder;
    return {
      memberId,
      sharePaise: isRemainderRecipient ? baseShare + 1 : baseShare,
    };
  });

  return { shares, baseShare, remainder };
}

/**
 * Direct Pairwise Split Engine.
 * 
 * Logic:
 * 1. For each expense, whoever spent money divides it equally among the beneficiaries.
 *    Each beneficiary directly owes the payer their share of that expense.
 * 2. Between any two friends (A and B):
 *    - Calculate what B owes A for A's expenses.
 *    - Calculate what A owes B for B's expenses.
 * 3. Subtract the smaller amount from the larger amount:
 *    - The friend who owes more only transfers the remaining net difference.
 *    - The other friend transfers ₹0.
 * 
 * This avoids any confusing triangular debt routes and guarantees direct, transparent settlement.
 */
export function calculateTripBalances(
  members: Member[],
  expenses: Expense[]
): TripCalculationResult {
  const memberMap = new Map<string, Member>();
  members.forEach((m) => memberMap.set(m.id, m));

  // Initialize summary for every member
  const memberSummaries: Record<string, MemberExpenseSummary> = {};
  for (const member of members) {
    memberSummaries[member.id] = {
      memberId: member.id,
      name: member.name,
      isArchived: !!member.archivedAt,
      totalPaidPaise: 0,
      totalFairSharePaise: 0,
      netBalancePaise: 0,
      expensesPaidCount: 0,
      expensesBenefitedCount: 0,
      status: 'settled',
      directSettlements: [],
    };
  }

  // 2D Debt Matrix: pairwiseDebtsMap[debtorId][payerId] = paise
  const pairwiseDebtsMap: Record<string, Record<string, number>> = {};
  for (const m1 of members) {
    pairwiseDebtsMap[m1.id] = {};
    for (const m2 of members) {
      pairwiseDebtsMap[m1.id][m2.id] = 0;
    }
  }

  let totalTripPaise = 0;
  const expenseShares: Record<string, ExpenseShareDetail> = {};

  // Process each expense
  for (const exp of expenses) {
    totalTripPaise += exp.amountPaise;

    // Credit payer
    if (memberSummaries[exp.payerMemberId]) {
      memberSummaries[exp.payerMemberId].totalPaidPaise += exp.amountPaise;
      memberSummaries[exp.payerMemberId].expensesPaidCount += 1;
    }

    // Allocate shares among beneficiaries
    const validBeneficiaries = exp.beneficiaryMemberIds.filter((id) => memberMap.has(id));
    const { shares, baseShare, remainder } = calculateBeneficiaryShares(
      exp.amountPaise,
      validBeneficiaries
    );

    // Update each beneficiary's consumed share and direct debt to payer
    for (const share of shares) {
      if (memberSummaries[share.memberId]) {
        memberSummaries[share.memberId].totalFairSharePaise += share.sharePaise;
        memberSummaries[share.memberId].expensesBenefitedCount += 1;
      }

      // If the beneficiary is not the payer, they directly owe the payer this share!
      if (share.memberId !== exp.payerMemberId) {
        if (!pairwiseDebtsMap[share.memberId]) {
          pairwiseDebtsMap[share.memberId] = {};
        }
        const prev = pairwiseDebtsMap[share.memberId][exp.payerMemberId] || 0;
        pairwiseDebtsMap[share.memberId][exp.payerMemberId] = prev + share.sharePaise;
      }
    }

    const payerName = memberMap.get(exp.payerMemberId)?.name || 'Unknown';
    let explanation = `${payerName} spent ${formatINR(exp.amountPaise)} split across ${
      validBeneficiaries.length
    } people (${formatINR(baseShare)} each`;
    if (remainder > 0) {
      explanation += `, with ${remainder} paise remainder distributed)`;
    } else {
      explanation += `)`;
    }

    expenseShares[exp.id] = {
      expenseId: exp.id,
      title: exp.title,
      totalPaise: exp.amountPaise,
      payerMemberId: exp.payerMemberId,
      beneficiaryShares: shares,
      remainderPaise: remainder,
      baseSharePaise: baseShare,
      explanation,
    };
  }

  // Calculate net balance for each member: Total Spent - Total Share
  let sumPaidPaise = 0;
  let sumFairSharePaise = 0;
  let sumNetBalancePaise = 0;

  for (const memberId of Object.keys(memberSummaries)) {
    const summary = memberSummaries[memberId];
    summary.netBalancePaise = summary.totalPaidPaise - summary.totalFairSharePaise;

    if (summary.netBalancePaise > 0) {
      summary.status = 'gets_back';
    } else if (summary.netBalancePaise < 0) {
      summary.status = 'owes';
    } else {
      summary.status = 'settled';
    }

    sumPaidPaise += summary.totalPaidPaise;
    sumFairSharePaise += summary.totalFairSharePaise;
    sumNetBalancePaise += summary.netBalancePaise;
  }

  // Compute Pairwise Net Settlement between every pair of friends
  const pairwiseDebts: PairwiseDebt[] = [];
  const settlementTransfers: SettlementTransfer[] = [];

  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const memberA = members[i];
      const memberB = members[j];

      const aOwesB = pairwiseDebtsMap[memberA.id]?.[memberB.id] || 0;
      const bOwesA = pairwiseDebtsMap[memberB.id]?.[memberA.id] || 0;

      if (aOwesB === 0 && bOwesA === 0) {
        continue;
      }

      let netSenderId: string | null = null;
      let netReceiverId: string | null = null;
      let netAmount = 0;
      let explanation = '';

      if (aOwesB > bOwesA) {
        netAmount = aOwesB - bOwesA;
        netSenderId = memberA.id;
        netReceiverId = memberB.id;

        explanation = `${memberA.name} owes ${memberB.name} ${formatINR(
          aOwesB
        )} for ${memberB.name}'s expenses, and ${memberB.name} owes ${memberA.name} ${formatINR(
          bOwesA
        )} for ${memberA.name}'s expenses. Subtracting ${formatINR(bOwesA)} from ${formatINR(
          aOwesB
        )}: ${memberA.name} only sends ${formatINR(netAmount)} to ${memberB.name}.`;

        settlementTransfers.push({
          fromMemberId: memberA.id,
          toMemberId: memberB.id,
          amountPaise: netAmount,
          explanation,
          fromOwesToPaise: aOwesB,
          toOwesFromPaise: bOwesA,
        });

        // Add to Member A's direct list
        memberSummaries[memberA.id].directSettlements.push({
          otherMemberId: memberB.id,
          otherMemberName: memberB.name,
          theyOweMePaise: bOwesA,
          iOweThemPaise: aOwesB,
          netAmountPaise: netAmount,
          direction: 'pay',
          explanation,
        });

        // Add to Member B's direct list
        memberSummaries[memberB.id].directSettlements.push({
          otherMemberId: memberA.id,
          otherMemberName: memberA.name,
          theyOweMePaise: aOwesB,
          iOweThemPaise: bOwesA,
          netAmountPaise: netAmount,
          direction: 'receive',
          explanation,
        });
      } else if (bOwesA > aOwesB) {
        netAmount = bOwesA - aOwesB;
        netSenderId = memberB.id;
        netReceiverId = memberA.id;

        explanation = `${memberB.name} owes ${memberA.name} ${formatINR(
          bOwesA
        )} for ${memberA.name}'s expenses, and ${memberA.name} owes ${memberB.name} ${formatINR(
          aOwesB
        )} for ${memberB.name}'s expenses. Subtracting ${formatINR(aOwesB)} from ${formatINR(
          bOwesA
        )}: ${memberB.name} only sends ${formatINR(netAmount)} to ${memberA.name}.`;

        settlementTransfers.push({
          fromMemberId: memberB.id,
          toMemberId: memberA.id,
          amountPaise: netAmount,
          explanation,
          fromOwesToPaise: bOwesA,
          toOwesFromPaise: aOwesB,
        });

        // Add to Member B's direct list
        memberSummaries[memberB.id].directSettlements.push({
          otherMemberId: memberA.id,
          otherMemberName: memberA.name,
          theyOweMePaise: aOwesB,
          iOweThemPaise: bOwesA,
          netAmountPaise: netAmount,
          direction: 'pay',
          explanation,
        });

        // Add to Member A's direct list
        memberSummaries[memberA.id].directSettlements.push({
          otherMemberId: memberB.id,
          otherMemberName: memberB.name,
          theyOweMePaise: bOwesA,
          iOweThemPaise: aOwesB,
          netAmountPaise: netAmount,
          direction: 'receive',
          explanation,
        });
      } else {
        // Exactly equal and canceled out!
        explanation = `Both ${memberA.name} and ${memberB.name} owe each other ${formatINR(
          aOwesB
        )}, which completely cancel out to ₹0.00.`;

        memberSummaries[memberA.id].directSettlements.push({
          otherMemberId: memberB.id,
          otherMemberName: memberB.name,
          theyOweMePaise: bOwesA,
          iOweThemPaise: aOwesB,
          netAmountPaise: 0,
          direction: 'settled',
          explanation,
        });

        memberSummaries[memberB.id].directSettlements.push({
          otherMemberId: memberA.id,
          otherMemberName: memberA.name,
          theyOweMePaise: aOwesB,
          iOweThemPaise: bOwesA,
          netAmountPaise: 0,
          direction: 'settled',
          explanation,
        });
      }

      pairwiseDebts.push({
        memberAId: memberA.id,
        memberAName: memberA.name,
        memberBId: memberB.id,
        memberBName: memberB.name,
        aOwesBPaise: aOwesB,
        bOwesAPaise: bOwesA,
        netSenderId,
        netReceiverId,
        netAmountPaise: netAmount,
        explanation,
      });
    }
  }

  // Sort settlement transfers by largest amount first
  settlementTransfers.sort((a, b) => b.amountPaise - a.amountPaise);

  // Total debt in trip is sum of all positive net balances
  const totalDebtPaise = Object.values(memberSummaries).reduce((acc, curr) => {
    return curr.netBalancePaise > 0 ? acc + curr.netBalancePaise : acc;
  }, 0);

  const isFullySettled = totalDebtPaise === 0 || settlementTransfers.length === 0;

  // Validation
  const errors: string[] = [];
  if (sumPaidPaise !== totalTripPaise) {
    errors.push(
      `Total spent (${formatINR(sumPaidPaise)}) does not equal total trip expenses (${formatINR(
        totalTripPaise
      )})`
    );
  }
  if (sumFairSharePaise !== totalTripPaise) {
    errors.push(
      `Total shares (${formatINR(
        sumFairSharePaise
      )}) do not equal total trip expenses (${formatINR(totalTripPaise)})`
    );
  }
  if (sumNetBalancePaise !== 0) {
    errors.push(
      `Sum of net balances (${formatINR(sumNetBalancePaise)}) is not zero (imbalance of ${sumNetBalancePaise} paise)`
    );
  }

  return {
    tripId: members[0]?.tripId || '',
    totalTripPaise,
    memberSummaries,
    expenseShares,
    settlementTransfers,
    pairwiseDebts,
    isFullySettled,
    totalDebtPaise,
    validation: {
      isValid: errors.length === 0,
      sumPaidPaise,
      sumFairSharePaise,
      sumNetBalancePaise,
      errors,
    },
  };
}

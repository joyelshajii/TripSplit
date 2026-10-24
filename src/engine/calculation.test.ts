import { describe, it, expect } from 'vitest';
import {
  calculateTripBalances,
  calculateBeneficiaryShares,
} from './calculation';
import { Member, Expense } from '../types';
import { rupeesToPaise } from '../utils/currency';

function createMember(id: string, name: string): Member {
  return {
    id,
    tripId: 'test-trip-1',
    name,
    createdAt: new Date().toISOString(),
  };
}

function createExpense(
  id: string,
  title: string,
  amountRupees: number,
  payerMemberId: string,
  beneficiaryMemberIds: string[],
  category = 'Food' as const
): Expense {
  return {
    id,
    tripId: 'test-trip-1',
    title,
    amountPaise: rupeesToPaise(amountRupees),
    payerMemberId,
    beneficiaryMemberIds,
    category,
    expenseDate: '2026-10-26',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('Direct Pairwise Split Calculation Engine', () => {
  it('1. Matches the exact user example: Me (1000), Friend A (500), Friend B (30), Friend C (2000)', () => {
    const me = createMember('m_me', 'Me');
    const friendA = createMember('m_a', 'Friend A');
    const friendB = createMember('m_b', 'Friend B');
    const friendC = createMember('m_c', 'Friend C');
    const members = [me, friendA, friendB, friendC];

    const expMe = createExpense('e1', 'Expense Me', 1000, 'm_me', ['m_me', 'm_a', 'm_b', 'm_c']);
    const expA = createExpense('e2', 'Expense A', 500, 'm_a', ['m_me', 'm_a', 'm_b', 'm_c']);
    const expB = createExpense('e3', 'Expense B', 30, 'm_b', ['m_me', 'm_a', 'm_b', 'm_c']);
    const expC = createExpense('e4', 'Expense C', 2000, 'm_c', ['m_me', 'm_a', 'm_b', 'm_c']);

    const res = calculateTripBalances(members, [expMe, expA, expB, expC]);

    // Total trip = 1000 + 500 + 30 + 2000 = ₹3,530 (353000 paise)
    expect(res.totalTripPaise).toBe(353000);

    // Pairwise transfers check:
    // 1. Friend A sends Me ₹125 (250 - 125 = 125)
    const transferAtoMe = res.settlementTransfers.find(
      (t) => t.fromMemberId === 'm_a' && t.toMemberId === 'm_me'
    );
    expect(transferAtoMe).toBeDefined();
    expect(transferAtoMe?.amountPaise).toBe(12500); // ₹125.00

    // 2. Friend B sends Me ₹242.50 (250 - 7.50 = 242.50)
    const transferBtoMe = res.settlementTransfers.find(
      (t) => t.fromMemberId === 'm_b' && t.toMemberId === 'm_me'
    );
    expect(transferBtoMe).toBeDefined();
    expect(transferBtoMe?.amountPaise).toBe(24250); // ₹242.50

    // 3. Me sends Friend C ₹250 (500 - 250 = 250)
    const transferMetoC = res.settlementTransfers.find(
      (t) => t.fromMemberId === 'm_me' && t.toMemberId === 'm_c'
    );
    expect(transferMetoC).toBeDefined();
    expect(transferMetoC?.amountPaise).toBe(25000); // ₹250.00

    // 4. Friend B sends Friend A ₹117.50 (125 - 7.50 = 117.50)
    const transferBtoA = res.settlementTransfers.find(
      (t) => t.fromMemberId === 'm_b' && t.toMemberId === 'm_a'
    );
    expect(transferBtoA).toBeDefined();
    expect(transferBtoA?.amountPaise).toBe(11750); // ₹117.50

    // 5. Friend A sends Friend C ₹375 (500 - 125 = 375)
    const transferAtoC = res.settlementTransfers.find(
      (t) => t.fromMemberId === 'm_a' && t.toMemberId === 'm_c'
    );
    expect(transferAtoC).toBeDefined();
    expect(transferAtoC?.amountPaise).toBe(37500); // ₹375.00

    // 6. Friend B sends Friend C ₹492.50 (500 - 7.50 = 492.50)
    const transferBtoC = res.settlementTransfers.find(
      (t) => t.fromMemberId === 'm_b' && t.toMemberId === 'm_c'
    );
    expect(transferBtoC).toBeDefined();
    expect(transferBtoC?.amountPaise).toBe(49250); // ₹492.50

    // Verify all 6 direct pairwise transfers exist
    expect(res.settlementTransfers).toHaveLength(6);

    // Sum of net balances is strictly zero
    expect(res.validation.sumNetBalancePaise).toBe(0);
    expect(res.validation.isValid).toBe(true);
  });

  it('2. Two people share a ₹1,000 expense equally', () => {
    const m1 = createMember('m1', 'Joel');
    const m2 = createMember('m2', 'Arun');
    const exp = createExpense('e1', 'Hotel', 1000, 'm1', ['m1', 'm2']);

    const res = calculateTripBalances([m1, m2], [exp]);

    expect(res.settlementTransfers).toHaveLength(1);
    expect(res.settlementTransfers[0].fromMemberId).toBe('m2');
    expect(res.settlementTransfers[0].toMemberId).toBe('m1');
    expect(res.settlementTransfers[0].amountPaise).toBe(50000); // ₹500
  });

  it('3. Payer buys an item exclusively for another person', () => {
    const m1 = createMember('m1', 'Joel');
    const m2 = createMember('m2', 'Arun');
    const exp = createExpense('e1', 'Arun T-Shirt', 100, 'm1', ['m2']);

    const res = calculateTripBalances([m1, m2], [exp]);

    // Arun owes Joel 100, Joel owes Arun 0 -> Arun sends Joel 100
    expect(res.settlementTransfers).toHaveLength(1);
    expect(res.settlementTransfers[0].fromMemberId).toBe('m2');
    expect(res.settlementTransfers[0].toMemberId).toBe('m1');
    expect(res.settlementTransfers[0].amountPaise).toBe(10000);
  });

  it('4. Mutual offset cancels out to zero when both paid equal amounts for each other', () => {
    const m1 = createMember('m1', 'Joel');
    const m2 = createMember('m2', 'Arun');
    const exp1 = createExpense('e1', 'Lunch for Arun', 500, 'm1', ['m2']);
    const exp2 = createExpense('e2', 'Dinner for Joel', 500, 'm2', ['m1']);

    const res = calculateTripBalances([m1, m2], [exp1, exp2]);

    expect(res.settlementTransfers).toHaveLength(0);
    expect(res.isFullySettled).toBe(true);
  });

  it('5. Amounts that do not divide evenly distribute remainder paise deterministically', () => {
    const { shares, baseShare, remainder } = calculateBeneficiaryShares(10000, ['m1', 'm2', 'm3']);

    expect(baseShare).toBe(3333);
    expect(remainder).toBe(1);
    expect(shares[0].sharePaise).toBe(3334);
    expect(shares[1].sharePaise).toBe(3333);
    expect(shares[2].sharePaise).toBe(3333);

    const sum = shares.reduce((acc, s) => acc + s.sharePaise, 0);
    expect(sum).toBe(10000);
  });

  it('6. Subset of beneficiaries in a 5-person trip', () => {
    const members = ['m1', 'm2', 'm3', 'm4', 'm5'].map((id) => createMember(id, `Member ${id}`));
    // m1 pays ₹600 for m1, m2, m3 (₹200 each). m4 and m5 are not in this expense.
    const exp = createExpense('e1', 'Activity', 600, 'm1', ['m1', 'm2', 'm3']);

    const res = calculateTripBalances(members, [exp]);

    // Only m2 and m3 owe m1 ₹200 each.
    expect(res.settlementTransfers).toHaveLength(2);

    const transferM2toM1 = res.settlementTransfers.find((t) => t.fromMemberId === 'm2' && t.toMemberId === 'm1');
    expect(transferM2toM1?.amountPaise).toBe(20000);

    const transferM3toM1 = res.settlementTransfers.find((t) => t.fromMemberId === 'm3' && t.toMemberId === 'm1');
    expect(transferM3toM1?.amountPaise).toBe(20000);

    // m4 and m5 have 0 transfers
    const m4Transfers = res.settlementTransfers.filter((t) => t.fromMemberId === 'm4' || t.toMemberId === 'm4');
    expect(m4Transfers).toHaveLength(0);
  });

  it('7. A trip with no expenses has zero transfers and is fully settled', () => {
    const m1 = createMember('m1', 'Joel');
    const m2 = createMember('m2', 'Arun');

    const res = calculateTripBalances([m1, m2], []);
    expect(res.totalTripPaise).toBe(0);
    expect(res.settlementTransfers).toHaveLength(0);
    expect(res.isFullySettled).toBe(true);
    expect(res.validation.isValid).toBe(true);
  });

  it('8. Multiple expenses paid by different people with mutual netting', () => {
    const m1 = createMember('m1', 'Joel');
    const m2 = createMember('m2', 'Arun');

    // Joel pays 1000 for both (Arun owes Joel 500)
    const exp1 = createExpense('e1', 'Fuel', 1000, 'm1', ['m1', 'm2']);
    // Arun pays 300 for both (Joel owes Arun 150)
    const exp2 = createExpense('e2', 'Snacks', 300, 'm2', ['m1', 'm2']);

    const res = calculateTripBalances([m1, m2], [exp1, exp2]);

    // Net: Arun owes Joel 500, Joel owes Arun 150 -> 500 - 150 = Arun sends Joel 350
    expect(res.settlementTransfers).toHaveLength(1);
    expect(res.settlementTransfers[0].fromMemberId).toBe('m2');
    expect(res.settlementTransfers[0].toMemberId).toBe('m1');
    expect(res.settlementTransfers[0].amountPaise).toBe(35000); // ₹350.00
  });
});

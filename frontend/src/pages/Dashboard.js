import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Plus, Download, TrendingDown, Calendar, Filter, LogOut, Settings, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    color: '#E15554'
  });

  const [budgetForm, setBudgetForm] = useState({
    category: '',
    amount: ''
  });

  useEffect(() => {
    fetchUser();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      fetchExpenses();
      fetchBudgets();
      fetchStats();
    }
  }, [selectedMonth, categories]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/me`, {
        credentials: 'include'
      });
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/expenses?month=${selectedMonth}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/categories`, {
        credentials: 'include'
      });
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchBudgets = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/budgets`, {
        credentials: 'include'
      });
      const data = await response.json();
      setBudgets(data.filter(b => b.month === selectedMonth));
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/stats/monthly?month=${selectedMonth}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const method = editingExpense ? 'PUT' : 'POST';
      const url = editingExpense
        ? `${process.env.REACT_APP_BACKEND_URL}/api/expenses/${editingExpense.expense_id}`
        : `${process.env.REACT_APP_BACKEND_URL}/api/expenses`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...expenseForm,
          amount: parseFloat(expenseForm.amount)
        })
      });

      if (response.ok) {
        toast.success(editingExpense ? 'Expense updated' : 'Expense added');
        setShowAddExpense(false);
        setEditingExpense(null);
        setExpenseForm({
          title: '',
          amount: '',
          category: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          notes: ''
        });
        fetchExpenses();
        fetchStats();
      } else {
        toast.error('Failed to save expense');
      }
    } catch (error) {
      console.error('Failed to save expense:', error);
      toast.error('Failed to save expense');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Delete this expense?')) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/expenses/${expenseId}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      if (response.ok) {
        toast.success('Expense deleted');
        fetchExpenses();
        fetchStats();
      } else {
        toast.error('Failed to delete expense');
      }
    } catch (error) {
      console.error('Failed to delete expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(categoryForm)
      });

      if (response.ok) {
        toast.success('Category added');
        setShowAddCategory(false);
        setCategoryForm({ name: '', color: '#E15554' });
        fetchCategories();
      } else {
        toast.error('Failed to add category');
      }
    } catch (error) {
      console.error('Failed to add category:', error);
      toast.error('Failed to add category');
    }
  };

  const handleSetBudget = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...budgetForm,
          amount: parseFloat(budgetForm.amount),
          month: selectedMonth
        })
      });

      if (response.ok) {
        toast.success('Budget set');
        setBudgetForm({ category: '', amount: '' });
        fetchBudgets();
      } else {
        toast.error('Failed to set budget');
      }
    } catch (error) {
      console.error('Failed to set budget:', error);
      toast.error('Failed to set budget');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/export/csv?month=${selectedMonth}`,
        { credentials: 'include' }
      );
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses_${selectedMonth}.csv`;
      a.click();
      toast.success('Exported successfully');
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Failed to export');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getCategoryColor = (categoryName) => {
    const cat = categories.find(c => c.name === categoryName);
    return cat?.color || '#6B7280';
  };

  const chartData = stats?.by_category
    ? Object.entries(stats.by_category).map(([name, value]) => ({
        name,
        value,
        color: getCategoryColor(name)
      }))
    : [];

  const budgetAlerts = budgets.map(budget => {
    const spent = stats?.by_category?.[budget.category] || 0;
    const percentage = (spent / budget.amount) * 100;
    return { ...budget, spent, percentage };
  }).filter(b => b.percentage > 0);

  if (loading && expenses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-100 via-background to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-stone-200 border-t-primary"></div>
          <p className="text-stone-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-background to-background">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-stone-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-900 font-heading">ZenTrack</h1>
              <p className="text-sm text-stone-500">Welcome back, {user?.name?.split(' ')[0]}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                data-testid="export-button"
                onClick={handleExportCSV}
                variant="ghost"
                size="sm"
                className="rounded-lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                data-testid="logout-button"
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="rounded-lg"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Month Selector */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            data-testid="prev-month-button"
            onClick={() => setSelectedMonth(format(subMonths(new Date(selectedMonth + '-01'), 1), 'yyyy-MM'))}
            variant="ghost"
            size="sm"
            className="rounded-lg"
          >
            ←
          </Button>
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-stone-100">
            <Calendar className="w-4 h-4 text-stone-500" />
            <span className="font-medium text-stone-900">
              {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
            </span>
          </div>
          <Button
            data-testid="next-month-button"
            onClick={() => {
              const next = format(subMonths(new Date(selectedMonth + '-01'), -1), 'yyyy-MM');
              if (next <= format(new Date(), 'yyyy-MM')) {
                setSelectedMonth(next);
              }
            }}
            variant="ghost"
            size="sm"
            className="rounded-lg"
            disabled={selectedMonth >= format(new Date(), 'yyyy-MM')}
          >
            →
          </Button>
        </div>

        {/* Bento Grid Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          {/* Total Balance Card */}
          <div className="col-span-1 md:col-span-4 bg-primary text-white rounded-2xl p-6 relative overflow-hidden metric-card shadow-lg">
            <div className="relative z-10">
              <p className="text-sm text-primary-foreground/80 mb-2">Total Expenses</p>
              <p className="text-4xl font-bold font-mono tracking-tighter">
                ₹{stats?.total?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-primary-foreground/60 mt-2">
                {stats?.count || 0} transactions
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="col-span-1 md:col-span-8 flex flex-wrap items-center gap-3">
            <Button
              data-testid="add-expense-button"
              onClick={() => {
                setEditingExpense(null);
                setExpenseForm({
                  title: '',
                  amount: '',
                  category: '',
                  date: format(new Date(), 'yyyy-MM-dd'),
                  notes: ''
                });
                setShowAddExpense(true);
              }}
              className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-medium transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Expense
            </Button>
            <Button
              data-testid="add-category-button"
              onClick={() => setShowAddCategory(true)}
              variant="secondary"
              className="h-12 px-6 rounded-full"
            >
              Add Category
            </Button>
            <Button
              data-testid="budget-settings-button"
              onClick={() => setShowBudgetSettings(true)}
              variant="secondary"
              className="h-12 px-6 rounded-full"
            >
              <Settings className="w-4 h-4 mr-2" />
              Budget
            </Button>
          </div>

          {/* Chart */}
          <div className="col-span-1 md:col-span-8 bg-white rounded-2xl border border-stone-100 shadow-sm p-6 min-h-[300px]">
            <h3 className="text-lg font-semibold text-stone-900 mb-4">Spending by Category</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                  <XAxis dataKey="name" stroke="#78716C" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#78716C" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E7E5E4',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-stone-400">
                No expenses yet
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="col-span-1 md:col-span-4 bg-white rounded-2xl border border-stone-100 shadow-sm p-6 overflow-y-auto max-h-[400px]">
            <h3 className="text-lg font-semibold text-stone-900 mb-4">Recent Expenses</h3>
            <div className="space-y-3">
              {expenses.slice(0, 10).map((expense) => (
                <div
                  key={expense.expense_id}
                  data-testid={`expense-item-${expense.expense_id}`}
                  className="flex items-start justify-between p-3 rounded-xl hover:bg-stone-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getCategoryColor(expense.category) }}
                      ></div>
                      <p className="font-medium text-stone-900 truncate">{expense.title}</p>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">{expense.category}</p>
                    <p className="text-xs text-stone-400">{format(new Date(expense.date), 'MMM dd')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-semibold text-stone-900">
                      ₹{expense.amount.toLocaleString()}
                    </p>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        data-testid={`edit-expense-${expense.expense_id}`}
                        onClick={() => {
                          setEditingExpense(expense);
                          setExpenseForm({
                            title: expense.title,
                            amount: expense.amount.toString(),
                            category: expense.category,
                            date: format(new Date(expense.date), 'yyyy-MM-dd'),
                            notes: expense.notes || ''
                          });
                          setShowAddExpense(true);
                        }}
                        className="p-1 hover:bg-stone-100 rounded"
                      >
                        ✏️
                      </button>
                      <button
                        data-testid={`delete-expense-${expense.expense_id}`}
                        onClick={() => handleDeleteExpense(expense.expense_id)}
                        className="p-1 hover:bg-stone-100 rounded"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {expenses.length === 0 && (
                <div className="text-center py-8 text-stone-400">
                  <p>No expenses yet</p>
                  <p className="text-sm mt-2">Add your first expense to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Budget Status */}
          {budgetAlerts.length > 0 && (
            <div className="col-span-1 md:col-span-12 bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Budget Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {budgetAlerts.map((budget) => (
                  <div key={budget.budget_id} className="p-4 rounded-xl bg-stone-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-stone-900">{budget.category}</span>
                      <span className={`text-sm font-semibold ${
                        budget.percentage > 100 ? 'text-red-600' :
                        budget.percentage > 80 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {budget.percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-stone-200 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          budget.percentage > 100 ? 'bg-red-600' :
                          budget.percentage > 80 ? 'bg-orange-600' :
                          'bg-green-600'
                        }`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-stone-500">
                      ₹{budget.spent.toLocaleString()} / ₹{budget.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Expense Dialog */}
      <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                data-testid="expense-title-input"
                value={expenseForm.title}
                onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                placeholder="Groceries, Coffee, etc."
                required
                className="rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                data-testid="expense-amount-input"
                type="number"
                step="0.01"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                placeholder="0.00"
                required
                className="rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={expenseForm.category}
                onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
                required
              >
                <SelectTrigger data-testid="expense-category-select" className="rounded-xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.category_id} value={cat.name}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        ></div>
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                data-testid="expense-date-input"
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                required
                className="rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                data-testid="expense-notes-input"
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                placeholder="Additional details..."
                className="rounded-xl"
              />
            </div>
            <Button
              data-testid="save-expense-button"
              type="submit"
              className="w-full h-12 rounded-full"
            >
              {editingExpense ? 'Update' : 'Add'} Expense
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div>
              <Label htmlFor="cat-name">Category Name</Label>
              <Input
                id="cat-name"
                data-testid="category-name-input"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g., Fitness, Education"
                required
                className="rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="cat-color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="cat-color"
                  data-testid="category-color-input"
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="w-20 h-12 rounded-xl"
                />
                <Input
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  placeholder="#E15554"
                  className="flex-1 rounded-xl"
                />
              </div>
            </div>
            <Button
              data-testid="save-category-button"
              type="submit"
              className="w-full h-12 rounded-full"
            >
              Add Category
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Budget Settings Dialog */}
      <Dialog open={showBudgetSettings} onOpenChange={setShowBudgetSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Budget for {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSetBudget} className="space-y-4">
            <div>
              <Label htmlFor="budget-category">Category</Label>
              <Select
                value={budgetForm.category}
                onValueChange={(value) => setBudgetForm({ ...budgetForm, category: value })}
                required
              >
                <SelectTrigger data-testid="budget-category-select" className="rounded-xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.category_id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="budget-amount">Budget Amount (₹)</Label>
              <Input
                id="budget-amount"
                data-testid="budget-amount-input"
                type="number"
                step="0.01"
                value={budgetForm.amount}
                onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                placeholder="5000"
                required
                className="rounded-xl"
              />
            </div>
            <Button
              data-testid="save-budget-button"
              type="submit"
              className="w-full h-12 rounded-full"
            >
              Set Budget
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      <button
        data-testid="fab-add-expense"
        onClick={() => {
          setEditingExpense(null);
          setExpenseForm({
            title: '',
            amount: '',
            category: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            notes: ''
          });
          setShowAddExpense(true);
        }}
        className="floating-action-btn md:hidden w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Dashboard;

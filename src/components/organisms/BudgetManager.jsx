import React, { useEffect, useRef, useState } from "react";
import { budgetService } from "@/services/api/budgetService";
import { transactionService } from "@/services/api/transactionService";
import { categoryService } from "@/services/api/categoryService";
import { toast } from "react-toastify";
import { formatCurrency, getCurrentMonth } from "@/utils/formatters";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import Select from "@/components/atoms/Select";
import Card from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
import FormField from "@/components/molecules/FormField";
import Budget from "@/components/pages/Budget";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";

const BudgetManager = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
const [formData, setFormData] = useState({
    category: "",
    monthlyLimit: ""
  });
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef(null);
  useEffect(() => {
    loadData();
  }, []);

  // Auto-save effect
  useEffect(() => {
    // Clear any pending save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Only auto-save if both fields have values
// Auto-save with partial data - validate what we have
    if (!formData.category && !formData.monthlyLimit) {
      return; // Need at least one field to save
    }

    const limit = formData.monthlyLimit ? parseFloat(formData.monthlyLimit) : null;
    if (formData.monthlyLimit && (isNaN(limit) || limit <= 0)) {
      return; // Only validate limit if provided
    }

    if (!formData.category) {
      return; // Category is required for budget creation
    }

    // Debounce auto-save by 500ms
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const currentMonth = getCurrentMonth();
        const [year, month] = currentMonth.split("-");
        
await budgetService.upsertBudget(
          formData.category,
          limit || 0,
          currentMonth,
          parseInt(year)
        );
        
        toast.success("Budget saved automatically");
        await loadData();
        
// Keep form open for continuous editing after auto-save
        // Form will be cleared/closed by user action or when switching budgets
      } catch (error) {
        toast.error(error.message || "Failed to save budget");
      } finally {
        setIsSaving(false);
      }
    }, 500);

    // Cleanup function
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
}, [formData.category, formData.monthlyLimit, editingBudgetId]);

const loadData = async () => {
    setLoading(true);
    setError("");
    
    try {
      const currentMonth = getCurrentMonth();
      const [budgetsData, categoriesData, transactionsData] = await Promise.all([
        budgetService.getByMonth(currentMonth),
        categoryService.getByType("expense"),
        transactionService.getByMonth(currentMonth)
      ]);
      
      setBudgets(budgetsData);
      setCategories(categoriesData);
      setTransactions(transactionsData.filter(t => t.type_c === "expense"));
    } catch (err) {
      setError("Failed to load budget data");
    } finally {
      setLoading(false);
    }
  };


const getSpentAmount = (categoryName) => {
    return transactions
      .filter(t => {
        const transactionCategory = t.category_c?.Name || t.category_c;
        return transactionCategory === categoryName;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount_c || 0), 0);
  };

  const getProgressPercentage = (spent, limit) => {
    return Math.min((spent / limit) * 100, 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return "error";
    if (percentage >= 75) return "warning";
    return "success";
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Budget Management</h2>
            <p className="text-slate-600">Set and track spending limits by category</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <ApperIcon name="Plus" className="w-4 h-4 mr-2" />
            {showForm ? "Cancel" : "Add Budget"}
          </Button>
        </div>

        {showForm && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
<form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Category">
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">Select category...</option>
{categories
                      .filter(cat => {
                        const catName = cat.Name || cat.name_c;
                        return !budgets.find(b => {
                          const budgetCatName = b.category_c?.Name || b.category_c;
                          return budgetCatName === catName;
                        });
                      })
                      .map(category => (
                        <option key={category.Id} value={category.Name || category.name_c}>
                          {category.Name || category.name_c}
                        </option>
                      ))
                    }
                  </Select>
                </FormField>

                <FormField label="Monthly Limit">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.monthlyLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthlyLimit: e.target.value }))}
                  />
                </FormField>
              </div>
              
<div className="flex justify-end items-center gap-2">
                {isSaving ? (
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <ApperIcon name="Loader2" className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="text-sm text-green-600">Auto-save enabled</span>
                )}
              </div>
            </form>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.length === 0 ? (
          <Card className="p-8 col-span-2">
            <div className="text-center">
              <ApperIcon name="PieChart" className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No budgets set</h3>
              <p className="text-slate-600 mb-4">
                Create your first budget to start tracking your spending limits
              </p>
              <Button onClick={() => setShowForm(true)}>
                <ApperIcon name="Plus" className="w-4 h-4 mr-2" />
                Add Your First Budget
              </Button>
            </div>
          </Card>
        ) : (
          budgets.map((budget) => {
const categoryName = budget.category_c?.Name || budget.category_c;
            const spent = getSpentAmount(categoryName);
            const percentage = getProgressPercentage(spent, budget.monthly_limit_c);
            const remaining = Math.max(0, budget.monthly_limit_c - spent);
            const color = getProgressColor(percentage);

            return (
              <Card key={budget.Id} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">{categoryName}</h3>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">
                        {formatCurrency(spent)} of {formatCurrency(budget.monthly_limit_c)}
                      </p>
                      <p className={`text-sm font-medium ${
                        remaining > 0 ? "text-success-600" : "text-error-600"
                      }`}>
                        {formatCurrency(remaining)} remaining
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700">
                        {percentage.toFixed(0)}% Used
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          color === "success" 
                            ? "bg-gradient-to-r from-success-500 to-success-600"
                            : color === "warning"
                            ? "bg-gradient-to-r from-warning-500 to-warning-600"
                            : "bg-gradient-to-r from-error-500 to-error-600"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {percentage >= 90 && (
                    <div className="flex items-center p-3 bg-error-50 border border-error-200 rounded-lg">
                      <ApperIcon name="AlertTriangle" className="w-5 h-5 text-error-600 mr-2" />
                      <p className="text-sm text-error-800">
                        {percentage >= 100 ? "Budget exceeded!" : "Close to budget limit"}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BudgetManager;
import React, { useState, useEffect } from "react";
import Button from "@/components/atoms/Button";
import FormField from "@/components/molecules/FormField";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import Card from "@/components/atoms/Card";
import { categoryService } from "@/services/api/categoryService";
import { formatDateInput } from "@/utils/formatters";
import { toast } from "react-toastify";

const TransactionForm = ({ onSubmit, onCancel, initialData = null, isEditing = false }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
const [formData, setFormData] = useState({
    amount_c: "",
    category_c: "",
    type_c: "expense",
    description_c: "",
    date_c: formatDateInput(new Date())
  });

  useEffect(() => {
    loadCategories();
  }, []);

useEffect(() => {
    if (initialData) {
      const categoryValue = initialData.category_c?.Name || initialData.category_c;
      setFormData({
        amount_c: Math.abs(initialData.amount_c || 0).toString(),
        category_c: categoryValue,
        type_c: initialData.type_c || "expense",
        description_c: initialData.description_c || "",
        date_c: formatDateInput(initialData.date_c || new Date())
      });
    }
  }, [initialData]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      toast.error("Failed to load categories");
    }
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount_c || !formData.category_c || !formData.description_c) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(formData.amount_c);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const selectedCategory = categories.find(c => c.Name === formData.category_c || c.name_c === formData.category_c);
      
      const transactionData = {
        amount_c: formData.type_c === "expense" ? -Math.abs(amount) : Math.abs(amount),
        type_c: formData.type_c,
        description_c: formData.description_c,
        date_c: new Date(formData.date_c).toISOString(),
        category_c: selectedCategory ? selectedCategory.Id : null
      };

      if (!transactionData.category_c) {
        toast.error("Invalid category selected");
        setLoading(false);
        return;
      }

      await onSubmit(transactionData);
      
      if (!isEditing) {
        setFormData({
          amount_c: "",
          category_c: "",
          type_c: "expense",
          description_c: "",
          date_c: formatDateInput(new Date())
        });
      }
    } catch (error) {
      toast.error(error.message || "Failed to save transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

const expenseCategories = categories.filter(c => c.type_c === "expense");
  const incomeCategories = categories.filter(c => c.type_c === "income");

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Type">
            <Select
              value={formData.type}
              onChange={(e) => {
                handleChange("type", e.target.value);
                handleChange("category", "");
              }}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </Select>
          </FormField>

          <FormField label="Amount *">
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Category *">
            <Select
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
            >
              <option value="">Select category...</option>
              {formData.type === "expense" && 
expenseCategories.map(category => (
                  <option key={category.Id} value={category.Name || category.name_c}>
                    {category.Name || category.name_c}
                  </option>
                ))
              }
              {formData.type_c === "income" && 
                incomeCategories.map(category => (
                  <option key={category.Id} value={category.Name || category.name_c}>
                    {category.Name || category.name_c}
                  </option>
                ))
              }
            </Select>
          </FormField>

          <FormField label="Date *">
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange("date", e.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Description *">
          <Input
            placeholder="Enter transaction description..."
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </FormField>

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : isEditing ? "Update Transaction" : "Add Transaction"}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default TransactionForm;
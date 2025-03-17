import React, { useState } from 'react';
import { Save, X, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ParticipantFormProps {
  onClose: () => void;
  onSuccess: () => void;
  studentId?: string;
}

const ParticipantForm: React.FC<ParticipantFormProps> = ({ onClose, onSuccess, studentId }) => {
  const [formData, setFormData] = useState({
    student_id: studentId || '',
    swim_level: 'beginner',
    medical_clearance: false,
    medical_conditions: '',
    emergency_contact: '',
    emergency_phone: '',
    parent_consent: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form data
      if (!formData.student_id || !formData.emergency_contact || !formData.emergency_phone) {
        throw new Error('Please fill in all required fields');
      }

      if (!formData.parent_consent) {
        throw new Error('Parent/Guardian consent is required');
      }

      // Submit to database
      const { error: submitError } = await supabase
        .from('ocean_swim_participants')
        .insert([{
          student_id: formData.student_id,
          swim_level: formData.swim_level,
          medical_clearance: formData.medical_clearance
        }]);

      if (submitError) throw submitError;

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Ocean Swim Registration</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">Student Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Swimming Level</label>
                <select
                  value={formData.swim_level}
                  onChange={(e) => setFormData({ ...formData, swim_level: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Medical Clearance</label>
                <div className="mt-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.medical_clearance}
                      onChange={(e) => setFormData({ ...formData, medical_clearance: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      Medical clearance obtained
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">Medical Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Medical Conditions & Allergies
              </label>
              <textarea
                value={formData.medical_conditions}
                onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="List any relevant medical conditions or allergies..."
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-lg font-medium mb-4">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Name</label>
                <input
                  type="text"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.emergency_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Consent */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Parent/Guardian Consent</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    I understand and accept the risks associated with ocean swimming. I give permission for my child to participate in the TAS Ocean Swim program and related activities.
                  </p>
                  <div className="mt-4">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.parent_consent}
                        onChange={(e) => setFormData({ ...formData, parent_consent: e.target.checked })}
                        className="rounded border-yellow-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                      <span className="ml-2 text-sm font-medium text-yellow-800">
                        I agree and provide consent
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              <Save size={18} className="mr-2" />
              {loading ? 'Submitting...' : 'Submit Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ParticipantForm;
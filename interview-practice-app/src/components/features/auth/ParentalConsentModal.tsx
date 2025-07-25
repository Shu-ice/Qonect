'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Clock,
  User,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import { PremiumCard, PremiumCardHeader, PremiumCardTitle, PremiumCardContent } from '@/components/ui/PremiumCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { cn } from '@/lib/utils';

interface ParentalConsentData {
  parentName: string;
  parentEmail: string;
  parentPhone?: string;
  relationToChild: string;
  consentGiven: boolean;
  consentTimestamp: Date;
  consentVersion: number;
  digitalSignature: string;
}

interface ParentalConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsent: (data: ParentalConsentData) => Promise<void>;
  studentName: string;
  isLoading?: boolean;
}

export function ParentalConsentModal({
  isOpen,
  onClose,
  onConsent,
  studentName,
  isLoading = false
}: ParentalConsentModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    relationToChild: '保護者',
    digitalSignature: '',
  });
  const [agreements, setAgreements] = useState({
    dataCollection: false,
    dataUsage: false,
    dataRetention: false,
    parentalRights: false,
    terms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAgreementChange = (field: string, checked: boolean) => {
    setAgreements(prev => ({ ...prev, [field]: checked }));
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.parentName.trim()) {
      newErrors.parentName = '保護者氏名を入力してください';
    }
    if (!formData.parentEmail.trim()) {
      newErrors.parentEmail = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail)) {
      newErrors.parentEmail = '正しいメールアドレスを入力してください';
    }
    if (!formData.relationToChild.trim()) {
      newErrors.relationToChild = 'お子様との関係を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const allAgreed = Object.values(agreements).every(agreed => agreed);
    if (!allAgreed) {
      setErrors({ agreements: 'すべての項目に同意していただく必要があります' });
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!formData.digitalSignature.trim()) {
      setErrors({ signature: 'デジタル署名を入力してください' });
      return false;
    }
    if (formData.digitalSignature !== formData.parentName) {
      setErrors({ signature: '保護者氏名と同じ名前を入力してください' });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setErrors({});
    
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    } else if (step === 3 && validateStep3()) {
      setStep(4);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    const consentData: ParentalConsentData = {
      ...formData,
      consentGiven: true,
      consentTimestamp: new Date(),
      consentVersion: 1,
    };

    await onConsent(consentData);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <PremiumCard variant="premium" size="lg" className="relative">
              {/* ヘッダー */}
              <PremiumCardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <Shield className="w-8 h-8 text-primary-600" />
                  </div>
                </div>
                <PremiumCardTitle className="text-primary-900">
                  保護者同意書
                </PremiumCardTitle>
                <p className="text-premium-600 mt-2">
                  {studentName} さんの面接練習アプリ利用について
                </p>
              </PremiumCardHeader>

              <PremiumCardContent>
                {/* ステップインジケーター */}
                <div className="flex justify-center mb-8">
                  <div className="flex items-center space-x-4">
                    {[1, 2, 3, 4].map((stepNumber) => (
                      <div key={stepNumber} className="flex items-center">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                            step >= stepNumber
                              ? 'bg-primary-500 text-white'
                              : 'bg-premium-200 text-premium-600'
                          )}
                        >
                          {step > stepNumber ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            stepNumber
                          )}
                        </div>
                        {stepNumber < 4 && (
                          <div
                            className={cn(
                              'w-12 h-0.5 mx-2 transition-colors',
                              step > stepNumber
                                ? 'bg-primary-500'
                                : 'bg-premium-200'
                            )}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ステップ1: 保護者情報 */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-premium-900 mb-2">
                        保護者情報の入力
                      </h3>
                      <p className="text-premium-600">
                        お子様の面接練習アプリ利用のため、保護者の方の情報を入力してください
                      </p>
                    </div>

                    <PremiumInput
                      label="保護者氏名"
                      placeholder="山田花子"
                      value={formData.parentName}
                      onChange={(e) => handleInputChange('parentName', e.target.value)}
                      error={errors.parentName}
                      leftIcon={<User className="w-4 h-4" />}
                      required
                      furigana
                    />

                    <PremiumInput
                      label="メールアドレス"
                      type="email"
                      placeholder="parent@example.com"
                      value={formData.parentEmail}
                      onChange={(e) => handleInputChange('parentEmail', e.target.value)}
                      error={errors.parentEmail}
                      leftIcon={<Mail className="w-4 h-4" />}
                      required
                    />

                    <PremiumInput
                      label="電話番号（任意）"
                      type="tel"
                      placeholder="090-1234-5678"
                      value={formData.parentPhone}
                      onChange={(e) => handleInputChange('parentPhone', e.target.value)}
                      leftIcon={<Phone className="w-4 h-4" />}
                    />

                    <PremiumInput
                      label="お子様との関係"
                      placeholder="保護者、父、母など"
                      value={formData.relationToChild}
                      onChange={(e) => handleInputChange('relationToChild', e.target.value)}
                      error={errors.relationToChild}
                      required
                    />
                  </motion.div>
                )}

                {/* ステップ2: プライバシーポリシーと同意 */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-premium-900 mb-2">
                        プライバシーポリシーへの同意
                      </h3>
                      <p className="text-premium-600">
                        以下の項目をお読みいただき、すべてに同意してください
                      </p>
                    </div>

                    <div className="bg-premium-50 rounded-lg p-6 space-y-4 max-h-64 overflow-y-auto">
                      {/* データ収集に関する同意 */}
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="dataCollection"
                          checked={agreements.dataCollection}
                          onChange={(e) => handleAgreementChange('dataCollection', e.target.checked)}
                          className="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="dataCollection" className="text-sm text-premium-700">
                          <strong>データ収集について：</strong>
                          面接練習の改善を目的として、お子様の音声データ、回答内容、学習進捗を収集することに同意します。
                        </label>
                      </div>

                      {/* データ利用に関する同意 */}
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="dataUsage"
                          checked={agreements.dataUsage}
                          onChange={(e) => handleAgreementChange('dataUsage', e.target.checked)}
                          className="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="dataUsage" className="text-sm text-premium-700">
                          <strong>データ利用について：</strong>
                          収集したデータは面接練習の個別最適化とサービス改善にのみ利用され、第三者に提供されないことを理解しています。
                        </label>
                      </div>

                      {/* データ保持に関する同意 */}
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="dataRetention"
                          checked={agreements.dataRetention}
                          onChange={(e) => handleAgreementChange('dataRetention', e.target.checked)}
                          className="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="dataRetention" className="text-sm text-premium-700">
                          <strong>データ保持期間：</strong>
                          データは最大1年間保持され、その後完全に削除されることを理解しています。
                        </label>
                      </div>

                      {/* 保護者の権利 */}
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="parentalRights"
                          checked={agreements.parentalRights}
                          onChange={(e) => handleAgreementChange('parentalRights', e.target.checked)}
                          className="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="parentalRights" className="text-sm text-premium-700">
                          <strong>保護者の権利：</strong>
                          いつでもデータの閲覧、修正、削除を要求できる権利があることを理解しています。
                        </label>
                      </div>

                      {/* 利用規約 */}
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="terms"
                          checked={agreements.terms}
                          onChange={(e) => handleAgreementChange('terms', e.target.checked)}
                          className="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="terms" className="text-sm text-premium-700">
                          <strong>利用規約：</strong>
                          サービスの利用規約に同意し、適切な利用を心がけることを約束します。
                        </label>
                      </div>
                    </div>

                    {errors.agreements && (
                      <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm">{errors.agreements}</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ステップ3: デジタル署名 */}
                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-premium-900 mb-2">
                        デジタル署名
                      </h3>
                      <p className="text-premium-600">
                        同意の証として、保護者氏名をもう一度入力してください
                      </p>
                    </div>

                    <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="w-4 h-4 text-warning-600" />
                        <span className="font-medium text-warning-800">デジタル署名について</span>
                      </div>
                      <p className="text-sm text-warning-700">
                        下記に保護者氏名「{formData.parentName}」を正確に入力することで、
                        上記のプライバシーポリシーと利用規約に同意したものとみなされます。
                      </p>
                    </div>

                    <PremiumInput
                      label="デジタル署名"
                      placeholder={formData.parentName}
                      value={formData.digitalSignature}
                      onChange={(e) => handleInputChange('digitalSignature', e.target.value)}
                      error={errors.signature}
                      variant="premium"
                      leftIcon={<FileText className="w-4 h-4" />}
                      required
                    />

                    <div className="flex items-center space-x-2 text-premium-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        署名日時: {new Date().toLocaleString('ja-JP')}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* ステップ4: 完了確認 */}
                {step === 4 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6"
                  >
                    <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-success-600" />
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-premium-900 mb-2">
                        同意書の確認
                      </h3>
                      <p className="text-premium-600">
                        入力内容をご確認の上、「同意して開始」ボタンを押してください
                      </p>
                    </div>

                    <div className="bg-premium-50 rounded-lg p-6 text-left space-y-3">
                      <div className="flex justify-between">
                        <span className="text-premium-600">保護者氏名:</span>
                        <span className="font-medium">{formData.parentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-premium-600">メールアドレス:</span>
                        <span className="font-medium">{formData.parentEmail}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-premium-600">お子様との関係:</span>
                        <span className="font-medium">{formData.relationToChild}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-premium-600">同意日時:</span>
                        <span className="font-medium">{new Date().toLocaleString('ja-JP')}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ボタンエリア */}
                <div className="flex justify-between mt-8">
                  <PremiumButton
                    variant="ghost"
                    onClick={step === 1 ? onClose : handleBack}
                    disabled={isLoading}
                  >
                    {step === 1 ? 'キャンセル' : '戻る'}
                  </PremiumButton>

                  <PremiumButton
                    variant="premium"
                    onClick={step === 4 ? handleSubmit : handleNext}
                    loading={isLoading}
                    disabled={isLoading}
                  >
                    {step === 4 ? '同意して開始' : '次へ'}
                  </PremiumButton>
                </div>
              </PremiumCardContent>
            </PremiumCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
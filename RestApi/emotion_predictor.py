import torch
import torch.nn.functional as F
from transformers import RobertaTokenizer, RobertaForSequenceClassification
import models
from typing import Tuple
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)


class EmotionPredictor:
    def __init__(self, model_path: str = 'roberta_plutchik.pt'):
        """
        Ініціалізація предиктора емоцій
        
        Args:
            model_path (str): Шлях до збереженої моделі
        """
        logging.info("Завантаження моделі...")        
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Створення маппінгу міток відповідно до вашої моделі
        self.label_dict = {
            'joy': 0,
            'trust': 1, 
            'fear': 2,
            'surprise': 3,
            'sadness': 4,
            'disgust': 5,
            'anger': 6,
            'anticipation': 7,
            'neutral': 8
        }
        
        # Зворотний маппінг
        self.reverse_label_dict = {v: k for k, v in self.label_dict.items()}
        
        # Завантаження токенізатора
        self.tokenizer = RobertaTokenizer.from_pretrained('roberta-base')
        
        # Завантаження моделі
        self.model = RobertaForSequenceClassification.from_pretrained(
            'roberta-base',
            num_labels=len(self.label_dict),
            output_attentions=False,
            output_hidden_states=False
        )
        
        # Завантаження збережених ваг
        self.model.load_state_dict(torch.load(model_path, map_location=self.device))
        self.model.to(self.device)
        self.model.eval()
        logging.info("Модель завантажена на пристрій: %s", self.device)
            
    def predict_emotion_with_confidence(self, text: str, max_length: int = 128) -> Tuple[models.EmotionType, float]:
        """
        Прогнозування емоції та впевненості для заданого тексту
        
        Args:
            text (str): Текст для аналізу
            max_length (int): Максимальна довжина токенізованого тексту
            
        Returns:
            Tuple[models.EmotionType, float]: Прогнозована емоція та впевненість (0-1)
        """
        # Токенізація тексту
        encoding = self.tokenizer(
            text,
            add_special_tokens=True,
            max_length=max_length,
            return_token_type_ids=False,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='pt'
        )
        
        input_ids = encoding['input_ids'].to(self.device)
        attention_mask = encoding['attention_mask'].to(self.device)
        
        # Прогнозування
        with torch.no_grad():
            outputs = self.model(input_ids=input_ids, attention_mask=attention_mask)
            logits = outputs.logits
            
            # Отримання ймовірностей через softmax
            probabilities = F.softmax(logits, dim=1)
            
            # Найвища ймовірність та відповідний клас
            confidence, predicted_class = torch.max(probabilities, dim=1)
            
            # Перетворення у відповідні типи
            emotion_name = self.reverse_label_dict[predicted_class.item()]
            confidence_value = confidence.item()
            
            # Перетворення назви емоції у EmotionType enum
            emotion_type = models.EmotionType(emotion_name.lower())
            
            return emotion_type, confidence_value
    
    def predict_all_emotions(self, text: str, max_length: int = 128) -> dict:
        """
        Повертає впевненість для всіх емоцій
        
        Args:
            text (str): Текст для аналізу
            max_length (int): Максимальна довжина токенізованого тексту
            
        Returns:
            dict: Словник з емоціями та їх впевненістю
        """
        # Токенізація тексту
        encoding = self.tokenizer(
            text,
            add_special_tokens=True,
            max_length=max_length,
            return_token_type_ids=False,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='pt'
        )
        
        input_ids = encoding['input_ids'].to(self.device)
        attention_mask = encoding['attention_mask'].to(self.device)
        
        # Прогнозування
        with torch.no_grad():
            outputs = self.model(input_ids=input_ids, attention_mask=attention_mask)
            logits = outputs.logits
            
            # Отримання ймовірностей через softmax
            probabilities = F.softmax(logits, dim=1)
            
            # Створення словника з результатами
            results = {}
            for idx, emotion_name in self.reverse_label_dict.items():
                emotion_type = models.EmotionType(emotion_name.upper())
                results[emotion_type] = probabilities[0][idx].item()
            
            return results

# Глобальний екземпляр предиктора (завантажується один раз при старті сервера)
emotion_predictor = None
emotion_classifier_model_path = Path(__file__).parent / "data" / "roberta_plutchik.pt"


def get_emotion_predictor() -> EmotionPredictor:
    """
    Повертає глобальний екземпляр предиктора (singleton pattern)
    """
    global emotion_predictor
    if emotion_predictor is None:
        emotion_predictor = EmotionPredictor(emotion_classifier_model_path)
    return emotion_predictor


def predict_emotion(text: str) -> models.NoteResultsResponse:
    """
    Функція-обгортка для прогнозування емоції
    
    Args:
        text (str): Текст для аналізу
        
    Returns:
        models.NoteResultsResponse: Результат з емоцією та впевненістю
    """
    predictor = get_emotion_predictor()
    emotion_type, confidence = predictor.predict_emotion_with_confidence(text)
    
    return models.NoteResultsResponse(
        emotion_type=emotion_type,
        confidence=confidence
    )
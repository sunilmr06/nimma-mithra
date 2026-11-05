import uuid
from app.extensions import db

class Building(db.Model):
    __tablename__ = 'buildings'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(30), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)

    floors = db.relationship('Floor', backref='building', cascade='all, delete-orphan', lazy='joined')

    def to_dict(self, include_floors=False):
        data = {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'description': self.description
        }
        if include_floors:
            data['floors'] = [floor.to_dict(include_rooms=True) for floor in sorted(self.floors, key=lambda f: f.floor_number)]
        return data


class Floor(db.Model):
    __tablename__ = 'floors'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    building_id = db.Column(db.String(36), db.ForeignKey('buildings.id'), nullable=False, index=True)
    floor_number = db.Column(db.Integer, nullable=False)
    floor_name = db.Column(db.String(50), nullable=True)

    rooms = db.relationship('Room', backref='floor', cascade='all, delete-orphan', lazy='joined')

    def to_dict(self, include_rooms=False):
        data = {
            'id': self.id,
            'building_id': self.building_id,
            'floor_number': self.floor_number,
            'floor_name': self.floor_name or f"Floor {self.floor_number}"
        }
        if include_rooms:
            data['rooms'] = [room.to_dict() for room in sorted(self.rooms, key=lambda r: r.room_number)]
        return data


class Room(db.Model):
    __tablename__ = 'rooms'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    floor_id = db.Column(db.String(36), db.ForeignKey('floors.id'), nullable=False, index=True)
    room_number = db.Column(db.String(30), nullable=False)
    room_type = db.Column(db.String(50), nullable=True)  # 'Classroom', 'Lab', 'Office', 'Restroom', etc.

    complaints = db.relationship('Complaint', backref='room', lazy='dynamic')

    def to_dict(self):
        floor = self.floor
        building = floor.building if floor else None
        return {
            'id': self.id,
            'floor_id': self.floor_id,
            'room_number': self.room_number,
            'room_type': self.room_type or 'General',
            'floor_number': floor.floor_number if floor else None,
            'building_id': building.id if building else None,
            'building_name': building.name if building else None,
            'location_display': f"{building.name if building else ''} - Floor {floor.floor_number if floor else ''} - Room {self.room_number}"
        }


class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    complaints = db.relationship('Complaint', backref='category', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_active': self.is_active
        }
